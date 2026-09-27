from flask import Flask, render_template, request, jsonify
import joblib
import json
import numpy as np

app = Flask(__name__)

# ------------------------------------------------------------
# Load model, scaler, and config at startup
# ------------------------------------------------------------
model = joblib.load('diabetes_model.pkl')
scaler = joblib.load('scaler.pkl')

with open('model_config.json', 'r') as f:
    config = json.load(f)

FEATURE_ORDER = config['feature_order']
DEFAULTS = config['defaults']
MEANS = config['means']
STDS = config['stds']
IMPORTANCES = config['importances']

FIELDS_SHOWN_TO_USER = ['Pregnancies', 'Glucose', 'BloodPressure', 'Insulin', 'BMI', 'Age']
FIELDS_AUTO_FILLED = ['SkinThickness', 'DiabetesPedigreeFunction']

# Valid input ranges (matches the Pima dataset's real observed range)
VALID_RANGES = {
    'Glucose': (44, 199),
    'BloodPressure': (24, 122),
    'BMI': (15, 70),
    'Age': (1, 100),
    'Insulin': (1, 200),
    'Pregnancies': (0, 20)
}


def get_bmi_category(bmi):
    if bmi < 18.5:
        return "Underweight"
    elif bmi < 25:
        return "Normal"
    elif bmi < 30:
        return "Overweight"
    else:
        return "Obese"


def get_age_group(age):
    if age < 30:
        return "21-29"
    elif age < 40:
        return "30-39"
    elif age < 50:
        return "40-49"
    elif age < 60:
        return "50-59"
    else:
        return "60+"


def get_glucose_category(glucose):
    if glucose < 140:
        return "Normal"
    elif glucose < 200:
        return "Pre-diabetic range"
    else:
        return "Diabetic range"


@app.route('/')
def home():
    return render_template('index.html', fields=FIELDS_SHOWN_TO_USER)


@app.route('/predict', methods=['POST'])
def predict():
    try:
        user_input = request.get_json()

        if user_input is None:
            return jsonify({"error": "No input data received."}), 400

        # Build the full 8-feature vector: user values + auto-filled defaults
        full_input = {}
        for feature in FEATURE_ORDER:
            if feature in FIELDS_SHOWN_TO_USER:
                value = user_input.get(feature)
                if value is None or value == '':
                    return jsonify({"error": f"Missing value for {feature}"}), 400
                try:
                    value = float(value)
                except (ValueError, TypeError):
                    return jsonify({"error": f"Invalid number for {feature}"}), 400

                min_val, max_val = VALID_RANGES[feature]
                if value < min_val or value > max_val:
                    return jsonify({
                        "error": f"{feature} must be between {min_val} and {max_val}. You entered {round(value, 1)}."
                    }), 400

                full_input[feature] = value
            else:
                full_input[feature] = float(DEFAULTS[feature])

        # Order values exactly as the model expects
        input_vector = np.array([[full_input[f] for f in FEATURE_ORDER]])

        # Scale using the same scaler from training
        input_scaled = scaler.transform(input_vector)

        # Predict
        probability = float(model.predict_proba(input_scaled)[0][1])
        prediction = int(model.predict(input_scaled)[0])

        # Contribution scoring: importance-weighted z-score deviation
        # Only include fields the user actually entered — auto-filled defaults are excluded
        contributions = []
        for feature in FIELDS_SHOWN_TO_USER:
            std_val = STDS[feature]
            z_score = (full_input[feature] - MEANS[feature]) / std_val if std_val > 0 else 0
            contribution = IMPORTANCES[feature] * z_score
            contributions.append({
                "feature": feature,
                "value": round(full_input[feature], 2),
                "contribution": round(contribution, 4)
            })

        contributions.sort(key=lambda x: abs(x['contribution']), reverse=True)

        result = {
            "prediction": "Diabetic" if prediction == 1 else "Non-Diabetic",
            "probability": round(probability * 100, 2),
            "risk_categories": {
                "bmi_category": get_bmi_category(full_input['BMI']),
                "age_group": get_age_group(full_input['Age']),
                "glucose_category": get_glucose_category(full_input['Glucose'])
            },
            "contributions": contributions
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)