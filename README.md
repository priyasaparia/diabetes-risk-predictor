# Diabetes Risk Predictor

A machine learning web application that predicts diabetes risk based on key health metrics, built on the Pima Indians Diabetes Dataset. The project covers the full pipeline — data preprocessing, exploratory data analysis, model training/comparison, and a live web interface for real-time predictions.

## Overview

This project uses the classic Pima Indians Diabetes Dataset to train and compare multiple machine learning models, selecting the best-performing one to power an interactive web app where users can input their health metrics and receive an instant, explained risk prediction.

**Final model: XGBoost with SMOTE oversampling**

| Metric | Score |
|---|---|
| Accuracy | 88.3% |
| Recall | 87.0% |
| F1-Score | 83.9% |
| ROC-AUC | 94.9% |

## Features

- **Data Preprocessing** — handles disguised missing values (biologically impossible zeros in Glucose, BMI, Blood Pressure, etc.), outlier detection, stratified train-test split, and proper feature scaling
- **Exploratory Data Analysis** — analyst-style visualizations including effect-size ranking (Cohen's d), risk-by-age-group and risk-by-BMI-category breakdowns, and physiological relationship charts (Glucose vs Insulin)
- **Model Comparison** — Logistic Regression, Random Forest, and XGBoost, each trained under two imbalance-handling strategies (class weighting and SMOTE), evaluated via confusion matrices, ROC-AUC curves, precision/recall/F1
- **Hyperparameter Tuning** — GridSearchCV optimized for F1-score, using leak-safe SMOTE pipelines during cross-validation
- **Web Application** — a single-page Flask app where users enter their health metrics and receive:
  - A Diabetic / Non-Diabetic prediction with confidence percentage
  - Risk category breakdown (Glucose level, BMI category, Age group)
  - A ranked explanation of which factors most influenced their specific result
  - Live BMI calculation from height and weight input

## Tech Stack

- **Data & Modeling:** Python, pandas, NumPy, scikit-learn, XGBoost, imbalanced-learn
- **Visualization:** Matplotlib, Seaborn
- **Backend:** Flask
- **Frontend:** HTML, CSS, JavaScript

## Project Structure

```
diabetes-webapp/
├── app.py                  # Flask backend — loads model, handles predictions
├── diabetes_model.pkl      # Trained XGBoost (SMOTE) model
├── scaler.pkl              # Fitted StandardScaler from training
├── model_config.json       # Feature order, defaults, means/stds, importances
├── templates/
│   └── index.html          # Web form UI
└── static/
    ├── style.css            # Styling
    └── script.js            # Form logic, BMI calculation, API calls
```

## Dataset

**Pima Indians Diabetes Dataset**
9 columns: Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI, DiabetesPedigreeFunction, Age, and Outcome (target: 0 = Non-Diabetic, 1 = Diabetic).

Source: [Kaggle](https://www.kaggle.com/datasets/jamaltariqcheema/pima-indians-diabetes-dataset)

## Setup & Installation

1. Clone the repository
```bash
git clone https://github.com/priyasaparia/diabetes-risk-predictor.git
cd diabetes-risk-predictor
```

2. Install dependencies
```bash
pip install flask joblib numpy scikit-learn xgboost imbalanced-learn
```

3. Run the app
```bash
python app.py
```

4. Open in your browser
```
http://127.0.0.1:5000
```

## How Predictions Work

The web form collects 6 inputs directly from the user (Pregnancies, Glucose, Blood Pressure, Insulin, Height + Weight for live BMI calculation, and Age). Two less commonly known fields — Skin Thickness and Diabetes Pedigree Function — are automatically filled in using dataset-average values, since the trained model requires all 8 original features to make a prediction.

Each prediction includes a contribution breakdown showing which entered factors pushed the result toward "Diabetic" or "Non-Diabetic," calculated using each feature's importance weighted by how far the user's value deviates from the dataset average.

## Input Ranges

| Field | Valid Range |
|---|---|
| Glucose (mg/dl) | 44 – 199 |
| Blood Pressure – Diastolic (mm/Hg) | 24 – 122 |
| Height (cm) | 100 – 250 |
| Weight (kg) | 20 – 250 |
| Age (years) | 1 – 100 |
| Insulin (mu U/ml) | 1 – 200 |
| Pregnancies | 0 – 20 |

## Disclaimer

This tool is built for educational and demonstrative purposes only. It is **not a medical diagnostic tool** and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider regarding any health concerns.

## License

This project is open source and available for educational use.
