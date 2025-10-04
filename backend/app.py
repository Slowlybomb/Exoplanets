from flask import Flask, request, jsonify, render_template, session
from flask_session import Session
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)
#Session(app)

# Load model
# model = joblib.load("asdf.joblib")

@app.route("/")
def mainpage():
    return render_template("index.html")

@app.route("/exoplanet", methods=["POST"])
def exoplanet():
    data = request.get_json()
    features = np.array([data["features"]])
    prediction = model.predict(features)
    return jsonify({"prediction": int(prediction)})