const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// SİTENİN ANA SAYFASI (GİRİŞSİZ, OTOMATİK IP BAZLI KOD ÜRETEN SİSTEM)
app.get('/', (req, res) => {
    // Render/Cloudflare arkasından kullanıcının gerçek IP'sini backend içinde çekiyoruz kanka
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "127.0.0.1";
    // IP adresindeki nokta ve iki nokta üst üste işaretlerini temizleyerek benzersiz bir sayısal tohum (seed) elde ediyoruz
    const cleanIp = clientIp.replace(/[^0-9]/g, '');
    const ipSeed = cleanIp ? parseInt(cleanIp.substring(0, 6)) : Math.floor(100000 + Math.random() * 900000);
    
    // Her IP'ye özel, o IP değişmedikçe hep sabit kalacak benzersiz doğrulama kodunu üretiyoruz kanka
    const generatedCode = "ROBUX-IP-" + (100000 + (ipSeed % 900000));

    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Robux Kazan - Doğrulama Paneli</title>
            <style>
                body {
                    background-color: #1a1a2e;
                    color: #ffffff;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .container {
                    background-color: #161623;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    text-align: center;
                    width: 350px;
                }
                h2 { color: #00fff0; margin-bottom: 20px; }
                button {
                    width: 96%;
                    padding: 12px;
                    background-color: #00fff0;
                    color: #121212;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: 0.3s;
                }
                button:hover { background-color: #00b8d4; }
                .code-box {
                    background-color: #22223b;
                    padding: 15px;
                    margin-top: 15px;
                    border-radius: 8px;
                    border: 1px dashed #00fff0;
                }
                .status { margin-top: 15px; font-weight: bold; font-size: 14px; }
                .ip-text { font-size: 11px; color: #555577; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Robux Kazanma Paneli</h2>
                <p style="color: #aaa; font-size: 14px;">IP Adresiniz Tanımlandı</p>
                
                <div class="code-box">
                    <p style="font-size: 13px; color: #ccc; text-align: left; margin-bottom: 15px;">
                        1. IP adresinize özel üretilen aşağıdaki kodu kopyalayın.<br>
                        2. Roblox profilinizdeki <b>Hakkımda (About)</b> kısmına yapıştırıp kaydedin.<br>
                        3. Ardından aşağıdaki butona basın.
                    </p>
                    <h3 id="generated-code" style="color: #ff007f; letter-spacing: 2px; background: #1a1a2e; padding: 10px; border-radius: 5px;">${generatedCode}</h3>
                    <button onclick="profilOnayla()" style="background-color: #ff007f; color: #fff;">Profilimi Onayla</button>
                </div>

                <div id="status-msg" class="status"></div>
                <div class="ip-text">Sistemdeki IP Kimliğiniz: ${clientIp}</div>
            </div>

            <script>
                const uretilenKod = "${generatedCode}";

                async function profilOnayla() {
                    const statusMsg = document.getElementById('status-msg');
                    statusMsg.innerText = "IP kodunuz tüm Roblox üzerinde aranıyor...";
                    statusMsg.style.color = "#00fff0";

                    try {
                        // Backend'e kodu gönderiyoruz, backend roblox'ta bu kodu tarayacak kanka
                        const response = await fetch('/api/verify-ip-code', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ generatedCode: uretilenKod })
                        });

                        const data = await response.json();

                        if (data.success) {
                            statusMsg.innerText = "Giriş Başarılı! Eşleşen Hesap: " + data.username;
                            statusMsg.style.color = "#00ff00";
                            // Kanka buraya ileride yönlendirilecek görev sayfasını bağlarız
                        } else {
                            statusMsg.innerText = "Hata: " + data.message;
                            statusMsg.style.color = "#ff3333";
                        }
                    } catch (error) {
                        statusMsg.innerText = "Doğrulama sırasında hata oluştu, tekrar deneyin.";
                        statusMsg.style.color = "#ff3333";
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// KODU TÜM ROBLOX ÜZERİNDE ARAYIP BULAN APİ
app.post('/api/verify-ip-code', async (req, res) => {
    const { generatedCode } = req.body;
    if (!generatedCode) return res.status(400).json({ success: false, message: "Kod eksik!" });

    // İstek atan kişinin IP adresini loglamak için alıyoruz kanka
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        // Roblox'un insan arama API'sini kullanarak profillerinde bu kod geçen kişileri aratıyoruz kanka
        const response = await axios.get(`https://roproxy.net{generatedCode}&limit=1`);
        
        // Eğer o kodu profiline yapıştırmış biri varsa listelenir kanka
        if (response.data && response.data.data && response.data.data.length > 0) {
            const foundUser = response.data.data[0];
            
            console.log(`[EŞLEŞME BAŞARILI] IP: ${clientIp} -> Roblox: ${foundUser.name} (ID: ${foundUser.id})`);
            
            // Başarılıysa ön yüze hesabı onaylayıp ismini fırlatıyoruz kanka
            return res.json({ success: true, username: foundUser.name, userId: foundUser.id });
        } else {
            return res.json({ success: false, message: "Bu kod henüz hiçbir Roblox profilinin açıklamasında bulunamadı! Lütfen kodu kaydedip 10 saniye sonra tekrar deneyin." });
        }
    } catch (error) {
        console.error("Roblox Arama Hatası:", error.message);
        return res.json({ success: false, message: "Roblox kontrol sistemi şu an yoğun, lütfen az sonra tekrar onaylayın." });
    }
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} üzerinde aktif.`);
});
