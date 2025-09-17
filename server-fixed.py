from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import google.generativeai as genai
import json, os

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
ROOFTOP_FILE = os.path.join(APP_ROOT, "rooftop.json")

# --- Load JSON data as context ---
def load_data():
    try:
        with open(ROOFTOP_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}

# --- Configure Gemini ---
genai.configure(api_key="AIzaSyBUnfdPYeUwxFjAcz2LAm_y1PAPlkmOWo4")
model = genai.GenerativeModel("gemini-1.5-flash")

app = Flask(__name__, static_folder=APP_ROOT, static_url_path="")
CORS(app)

data = load_data()

@app.route("/")
def index():
    return send_from_directory(APP_ROOT, "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(APP_ROOT, filename)

@app.route("/chat", methods=["POST"])
def chat():
    try:
        user_msg = request.json.get("message", "")

        # Build prompt with context
        prompt = f"""
You are GreenBot 🌱, an AI plant care assistant for rooftop gardens.

Here is plant knowledge you can use:
{json.dumps(data, indent=2)}

User: {user_msg}
Answer in a helpful, friendly way.
"""

        # Generate with Gemini
        response = model.generate_content(prompt)
        bot_text = response.text if response else "Sorry, I couldn’t generate a response."

        return jsonify({"bot": bot_text})
    except Exception as e:
        return jsonify({"bot": f"Error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
