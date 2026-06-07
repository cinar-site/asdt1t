from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
import random
import os

app = Flask(__name__)
CORS(app)  # Tarayıcı CORS engellerini tamamen kaldırır

verification_codes = {}

@app.route('/send-code', methods=['POST'])
def send_code():
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({'error': 'E-posta gerekli.'}), 400

    # 6 haneli kod üret
    code = str(random.randint(100000, 999999))
    verification_codes[email] = code

    # Gmail SMTP ayarları
    sender_email = "cinareymenozcelik6@gmail.com"
    sender_password = "wjsj qlbp agyl dhkk"

    msg = MIMEText(f"Sisteme giriş için doğrulama kodunuz: {code}")
    msg['Subject'] = 'Doğrulama Kodunuz'
    msg['From'] = sender_email
    msg['To'] = email

    try:
        with smtplib.SMTP_SSL('://gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, email, msg.as_string())
        return jsonify({'message': 'Kod gönderildi.'}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'E-posta gönderilemedi.'}), 500

@app.route('/verify-code', methods=['POST'])
def verify_code():
    data = request.json
    email = data.get('email')
    code = data.get('code')

    if email in verification_codes and verification_codes[email] == code:
        del verification_codes[email]
        return jsonify({'success': True}), 200
    
    return jsonify({'error': 'Hatalı veya süresi dolmuş kod.'}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
