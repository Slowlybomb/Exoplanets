from flask import Flask, request, jsonify, render_template, session
from flask_session import Session
from flask_cors import CORS
import pickle
import joblib
import json
import numpy as np

app = Flask(__name__)
CORS(app)
#Session(app)

# Load model
model = joblib.load('model_test_1.joblib')

@app.route("/")
def mainpage():
    return render_template("index.html")

@app.route("/exoplanet")
def exoplanet():
    #data = request.get_json()
    with open("test_data.json", "r") as f: data = json.load(f)
    features = np.array([list(data.values())])
    prediction = model.predict(features)[0]
    return jsonify({"prediction": int(prediction), "features": data})
    #eturn render_template("index.html")