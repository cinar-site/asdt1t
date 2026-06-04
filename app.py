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
        
        # URL YAPISI DÜZELTİLDİ: 404 hatasını önleyen en kararlı saf endpoint yapısı
        url = f"https://googleapis.com{API_KEY}"
        
        headers = {
            "Content-Type": "application/json"
        }
        
        # İstek gövdesini oluşturup Google'a gönderiyoruz
        response = requests.post(url, headers=headers, json={
            "contents": [{"parts": [{"text": user_text}]}]
        })
        
        # Eğer hâlâ Google tarafında bir sorun varsa bunu şeffafça görelim
        if response.status_code != 200:
            return jsonify({
                "error": {
                    "message": f"Google baglantiyi reddetti. Durum kodu: {response.status_code}",
                    "details": response.text
                }
            }), response.status_code

        res_json = response.json()
        
        # Gelen veriyi hatasız ayrıştıran Python haritalama katmanı
        if "candidates" in res_json and len(res_json["candidates"]) > 0:
            first_candidate = res_json["candidates"][0]
            if "content" in first_candidate and "parts" in first_candidate["content"] and len(first_candidate["content"]["parts"]) > 0:
                ai_text = first_candidate["content"]["parts"][0]["text"]
                
                # Ön yüzün (index.html) tam olarak beklediği veri formatına dönüştürüyoruz
                return jsonify({
                    "candidates": {
                        "content": {
                            "parts": {
                                "text": ai_text
                            }
                        }
                    }
                })
        
        return jsonify({"error": {"message": "Google'dan gecersiz veri yapisi geldi kanka."}}), 500
        
    except Exception as e:
        return jsonify({"error": {"message": f"Sunucu hatasi: {str(e)}"}}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
