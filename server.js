const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// SİTENİN ANA SAYFASI (HTML ve CSS TASARIMI)
app.get('/', (req, res) => {
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
                input {
                    width: 90%;
                    padding: 12px;
                    margin: 10px 0;
                    border: none;
                    border-radius: 8px;
                    background-color: #2e2e4f;
                    color: #fff;
                    font-size: 16px;
                }
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
                    display: none;
                    background-color: #22223b;
                    padding: 15px;
                    margin-top: 15px;
                    border-radius: 8px;
                    border: 1px dashed #00fff0;
                }
                .status { margin-top: 15px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Robux Kazanma Paneli</h2>
                <p>Şifresiz Güvenli Giriş</p>
                
                <div id="login-step">
                    <input type="text" id="username" placeholder="Roblox Kullanıcı Adı">
                    <button onclick="devamEt()">Giriş Yap</button>
                </div>

                <div id="verify-step" class="code-box">
                    <p style="font-size: 14px; color: #ccc;">Lütfen aşağıdaki kodu Roblox profilindeki "Hakkımda (About)" kısmına yapıştır ve onayla:</p>
                    <h3 id="generated-code" style="color: #ff007f; letter-spacing: 2px;"></h3>
                    <button onclick="dogrula()" style="background-color: #ff007f; color: #fff;">Profilimi Onayla</button>
                </div>

                <div id="status-msg" class="status"></div>
            </div>

            <script>
                let uretilenKod = "";
                let kullaniciAdi = "";

                function devamEt() {
                    kullaniciAdi = document.getElementById('username').value;
                    if(!kullaniciAdi) {
                        alert("Lütfen kullanıcı adınızı girin!");
                        return;
                    }
                    
                    // Rastgele profil doğrulama kodu üretiyoruz
                    uretilenKod = "ROBUX-" + Math.floor(100000 + Math.random() * 900000);
                    
                    document.getElementById('generated-code').innerText = uretilenKod;
                    document.getElementById('login-step').style.display = 'none';
                    document.getElementById('verify-step').style.display = 'block';
                </div>

                function dogrula() {
                    const statusMsg = document.getElementById('status-msg');
                    statusMsg.innerText = "Profiliniz kontrol ediliyor...";
                    statusMsg.style.color = "#00fff0";

                    // Burada senin backend API'sine istek atacağız (Kullanıcı ID bulma ve doğrulama mantığı)
                    // Şimdilik simüle ediyoruz, bir sonraki adımda tam bağlayacağız.
                    setTimeout(() => {
                        statusMsg.innerText = "Doğrulama başarılı! Görevler yükleniyor...";
                        statusMsg.style.color = "#00ff00";
                    }, 2000);
                }
            </script>
        </body>
        </html>
    `);
});

// PROFİL DOĞRULAMA API'Sİ (Zaten yazmıştık)
app.post('/api/verify', async (req, res) => {
    const { userId, generatedCode } = req.body;
    if (!userId || !generatedCode) return res.status(400).json({ error: "Eksik bilgi!" });

    try {
        const response = await axios.get(`https://roblox.com{userId}`);
        const userDescription = response.data.description || "";

        if (userDescription.includes(generatedCode)) {
            return res.json({ success: true });
        } else {
            return res.json({ success: false });
        }
    } catch (error) {
        return res.status(500).json({ error: "Hata oluştu" });
    }
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} üzerinde aktif.`);
});
