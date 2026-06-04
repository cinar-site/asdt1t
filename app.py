import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='.')
CORS(app) # Tüm tarayıcı engellerini kaldırır

# Kendi yapay zekanın kelime dağarcığı ve mantık motoru
# Burayı istediğin kadar soru-cevap ekleyerek büyütebilirsin kanka!
AI_HAFIZA = {
    "selam": "Selam kanka naber! Sonunda tüm engelleri yıktık ve sitemiz açıldı. 😎",
    "naber": "İyidir kanka bomba gibiyim, senden naber? Kodlamaya devam!",
    "kimsin": "Ben senin Render üzerinde sıfırdan kurduğun yerel yapay zeka asistanınım!",
    "kod": "HTML, CSS ve Flask (Python) kullanarak harika bir mimari kurdun kanka.",
    "nasılsın": "Kendi sunucumda tıkır tıkır çalıştığım için çok mutluyum kanka, sen nasılsın?",
    "eyvallah": "Ne demek kanka, lafı bile olmaz!",
    "sa": "Aleyküm selam kanka, hoş geldin!"
}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": {"message": "Mesaj boş olamaz kanka."}}), 400

        # Kullanıcının yazdığı yazıyı küçük harfe çevirip temizliyoruz
        user_text = data.get("text").strip().lower()
        
        # Yapay zekanın eşleşme arama algoritması
        ai_response = "Bu kelimeyi henüz hafızama eklemedin kanka. Ama sistemimiz sıfır hatayla çalışıyor! 🚀"
        
        for anahtar, cevap in AI_HAFIZA.items():
            if anahtar in user_text:
                ai_response = cevap
                break

        # Ön yüzün (index.html) çökmeden okuyabilmesi için orijinal Gemini veri yapısını taklit ediyoruz
        return jsonify({
            "candidates": {
                "content": {
                    "parts": {
                        "text": ai_response
                    }
                }
            }
        })
        
    except Exception as e:
        return jsonify({"error": {"message": f"Sunucu hatası: {str(e)}"}}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
