const FIELD_RANGES = {
    Glucose: { min: 44, max: 199 },
    BloodPressure: { min: 24, max: 122 },
    Height: { min: 100, max: 250 },
    Weight: { min: 20, max: 250 },
    Age: { min: 1, max: 100 },
    Insulin: { min: 1, max: 200 },
    Pregnancies: { min: 0, max: 20 }
};

const BMI_VALID_RANGE = { min: 15, max: 70 };

function getBmiCategory(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
}

function calculateAndDisplayBmi() {
    const heightInput = document.getElementById('Height');
    const weightInput = document.getElementById('Weight');
    const bmiDisplay = document.getElementById('bmiDisplay');
    const bmiValueEl = document.getElementById('bmiValue');
    const bmiCategoryEl = document.getElementById('bmiCategory');

    const height = parseFloat(heightInput.value);
    const weight = parseFloat(weightInput.value);

    if (isNaN(height) || isNaN(weight) || height <= 0) {
        bmiDisplay.classList.add('hidden');
        return null;
    }

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    const roundedBmi = Math.round(bmi * 10) / 10;

    bmiValueEl.textContent = roundedBmi;
    bmiCategoryEl.textContent = getBmiCategory(bmi);
    bmiDisplay.classList.remove('hidden');

    if (bmi < BMI_VALID_RANGE.min || bmi > BMI_VALID_RANGE.max) {
        bmiDisplay.classList.add('out-of-range');
    } else {
        bmiDisplay.classList.remove('out-of-range');
    }

    return roundedBmi;
}

document.getElementById('Height').addEventListener('input', calculateAndDisplayBmi);
document.getElementById('Weight').addEventListener('input', calculateAndDisplayBmi);

function validateField(id, label) {
    const el = document.getElementById(id);
    const value = parseFloat(el.value);
    const range = FIELD_RANGES[id];

    if (isNaN(value)) {
        return `${label} is required.`;
    }
    if (value < range.min || value > range.max) {
        return `${label} must be between ${range.min} and ${range.max}.`;
    }
    return null;
}

document.getElementById('predictionForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const resultSection = document.getElementById('resultSection');
    const errorSection = document.getElementById('errorSection');
    const errorText = document.getElementById('errorText');

    resultSection.classList.add('hidden');
    errorSection.classList.add('hidden');

    // ------------------------------------------------------------
    // Client-side validation before sending to backend
    // ------------------------------------------------------------
    const validations = [
        validateField('Glucose', 'Glucose'),
        validateField('BloodPressure', 'Blood Pressure'),
        validateField('Height', 'Height'),
        validateField('Weight', 'Weight'),
        validateField('Age', 'Age'),
        validateField('Insulin', 'Insulin'),
        validateField('Pregnancies', 'Pregnancies')
    ];

    const firstError = validations.find(v => v !== null && v !== undefined);
    if (firstError) {
        errorSection.classList.remove('hidden');
        errorText.textContent = firstError;
        return;
    }

    const bmi = calculateAndDisplayBmi();
    if (bmi === null) {
        errorSection.classList.remove('hidden');
        errorText.textContent = 'Please enter valid Height and Weight to calculate BMI.';
        return;
    }
    if (bmi < BMI_VALID_RANGE.min || bmi > BMI_VALID_RANGE.max) {
        errorSection.classList.remove('hidden');
        errorText.textContent = `Calculated BMI (${bmi}) is outside the model's valid range (${BMI_VALID_RANGE.min} – ${BMI_VALID_RANGE.max}). Please check your Height/Weight.`;
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Analyzing...';

    const formData = {
        Glucose: document.getElementById('Glucose').value,
        BloodPressure: document.getElementById('BloodPressure').value,
        BMI: bmi,
        Age: document.getElementById('Age').value,
        Insulin: document.getElementById('Insulin').value,
        Pregnancies: document.getElementById('Pregnancies').value
    };

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong.');
        }

        renderResult(data);

    } catch (err) {
        errorSection.classList.remove('hidden');
        errorText.textContent = err.message;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Get Prediction';
    }
});

function renderResult(data) {
    const resultSection = document.getElementById('resultSection');
    const resultCard = document.getElementById('resultCard');
    const resultLabel = document.getElementById('resultLabel');
    const probabilityBar = document.getElementById('probabilityBar');
    const probabilityText = document.getElementById('probabilityText');
    const riskCategories = document.getElementById('riskCategories');
    const contributionsList = document.getElementById('contributionsList');

    const isDiabetic = data.prediction === 'Diabetic';

    resultCard.className = 'result-card ' + (isDiabetic ? 'diabetic' : 'non-diabetic');
    resultLabel.textContent = isDiabetic ? '⚠ Diabetic Risk Detected' : '✓ Low Diabetic Risk';

    probabilityBar.style.width = data.probability + '%';
    probabilityText.textContent = `Model confidence: ${data.probability}% probability of diabetes`;

    riskCategories.innerHTML = `
        <div class="risk-tag">
            <span class="label">Glucose Level</span>
            <span class="value">${data.risk_categories.glucose_category}</span>
        </div>
        <div class="risk-tag">
            <span class="label">BMI Category</span>
            <span class="value">${data.risk_categories.bmi_category}</span>
        </div>
        <div class="risk-tag">
            <span class="label">Age Group</span>
            <span class="value">${data.risk_categories.age_group}</span>
        </div>
    `;

    const maxAbsContribution = Math.max(...data.contributions.map(c => Math.abs(c.contribution)));

    contributionsList.innerHTML = data.contributions.map(c => {
        const widthPercent = maxAbsContribution > 0 ? (Math.abs(c.contribution) / maxAbsContribution) * 100 : 0;
        const barColor = c.contribution > 0 ? '#D1495B' : '#4C9F70';

        return `
            <div class="contribution-item">
                <div class="contribution-bar-mini">
                    <div class="fill" style="width: ${widthPercent}%; background-color: ${barColor};"></div>
                </div>
                <span class="feature-name">${c.feature}</span>
                <span class="feature-value">${c.value}</span>
            </div>
        `;
    }).join('');

    resultSection.classList.remove('hidden');
}