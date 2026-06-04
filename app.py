import os
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='.')
CORS(app)

API_KEY = "AQ.Ab8RN6KekG8Jxv8dhE_sj_Q-RYohgm0byIwcP8U0dzCMXim4qQ"

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": {"message": "Mesaj bos olamaz kanka."}}), 400

        user_text = data.get("text")
        url = "https://googleapis.com"
        
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY
        }
        
        response = requests.post(url, headers=headers, json={
            "contents": [{"parts": [{"text": user_text}]}]
        })
        
        # Google hata döndürdüyse JSON parse etmeden yakala
        if response.status_code != 200:
            return jsonify({"error": {"message": f"Google baglantiyi reddetti. Durum kodu: {response.status_code}"}}), response.status_code

        res_json = response.json()
        
        # PYTHON İÇİN DOĞRU LİSTE AYRIŞTIRMASI (Hatanın tam çözümü):
        if "candidates" in res_json and len(res_json["candidates"]) > 0:
            candidate = res_json["candidates"][0]
            if "content" in candidate and "parts" in candidate["content"] and len(candidate["content"]["parts"]) > 0:
                ai_text = candidate["content"]["parts"][0]["text"]
                return jsonify({"candidates": {"content": {"parts": {"text": ai_text}}}})
        
        return jsonify({"error": {"message": "Google'dan gecersiz veri yapisi geldi."}}), 500
        
    except Exception as e:
        return jsonify({"error": {"message": f"Sunucu hatasi: {str(e)}"}}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
