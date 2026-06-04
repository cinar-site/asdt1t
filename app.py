import os
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='.')
CORS(app)

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
        
        # HUGGING FACE API: Hiçbir anahtar istemeyen, doğrudan çalışan açık kaynaklı yapay zeka adresi
        url = "https://huggingface.co"
        
        # İstek gövdesini hazırlıyoruz
        payload = {"inputs": user_text}
        
        response = requests.post(url, json=payload)
        
        if response.status_code != 200:
            return jsonify({"error": {"message": f"Yapay zeka sunucusu meşgul. Durum kodu: {response.status_code}"}}), response.status_code

        res_json = response.json()
        
        # Gelen veriyi güvenli bir şekilde ayrıştırıp ön yüzün (index.html) formatına uyduruyoruz
        if isinstance(res_json, list) and len(res_json) > 0 and "generated_text" in res_json[0]:
            ai_text = res_json[0]["generated_text"]
        elif "generated_text" in res_json:
            ai_text = res_json["generated_text"]
        else:
            ai_text = "Ne dediğini tam anlayamadım kanka, tekrar yazar mısın?"

        # Ön yüzün (index.html) çökmemesi için aynı veri yapısını taklit ediyoruz
        return jsonify({
            "candidates": {
                "content": {
                    "parts": {
                        "text": ai_text
                    }
                }
            }
        })
        
    except Exception as e:
        return jsonify({"error": {"message": f"Sunucu hatası: {str(e)}"}}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
