const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// SİTENİN ANA SAYFASI (ÖNCE HESAP KONTROLÜ YAPIP SONRA KOD VEREN SİSTEM)
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
                    text-align: center;
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
                .status { margin-top: 15px; font-weight: bold; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Robux Kazanma Paneli</h2>
                <p style="color: #aaa; font-size: 14px;">Roblox ID ile Güvenli Giriş</p>
                
                <div id="login-step">
                    <input type="text" id="userIdInput" placeholder="Roblox ID (Örn: 10418322305)">
                    <button id="loginBtn" onclick="hesapKontrolEt()">Giriş Yap</button>
                </div>

                <div id="verify-step" class="code-box">
                    <p style="font-size: 13px; color: #ccc; text-align: left; margin-bottom: 15px;">
                        1. Aşağıdaki kodu kopyalayın.<br>
                        2. Roblox profilinizdeki <b>Hakkımda (About)</b> kısmına yapıştırıp kaydedin.<br>
                        3. Ardından aşağıdaki butona basın.
                    </p>
                    <h3 id="generated-code" style="color: #ff007f; letter-spacing: 2px; background: #1a1a2e; padding: 10px; border-radius: 5px;"></h3>
                    <button onclick="profilOnayla()" style="background-color: #ff007f; color: #fff;">Profilimi Onayla</button>
                </div>

                <div id="status-msg" class="status"></div>
            </div>

            <script>
                let uretilenKod = "";
                let girilenUserId = "";

                // 1. ADIM: BUTONA BASILDIĞINDA ÖNCE HESABIN VARLIĞINI KONTROL EDEN FONKSİYON
                async function hesapKontrolEt() {
                    girilenUserId = document.getElementById('userIdInput').value.trim();
                    const statusMsg = document.getElementById('status-msg');
                    const loginBtn = document.getElementById('loginBtn');
                    
                    if(!girilenUserId || isNaN(girilenUserId)) {
                        alert("Lütfen geçerli bir sayısal Roblox ID girin!");
                        return;
                    }
                    
                    statusMsg.innerText = "Roblox ID kontrol ediliyor...";
                    statusMsg.style.color = "#00fff0";
                    loginBtn.disabled = true;

                    try {
                        // Backend'e sadece hesabı kontrol etmesi için istek atıyoruz
                        const response = await fetch('/api/check-user', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: girilenUserId })
                        });

                        const data = await response.json();

                        if (data.exists) {
                            // Hesap gerçekten varsa kod üretilip ekran değiştiriliyor kanka
                            uretilenKod = "ROBUX-" + Math.floor(100000 + Math.random() * 900000);
                            
                            document.getElementById('generated-code').innerText = uretilenKod;
                            document.getElementById('login-step').style.display = 'none';
                            document.getElementById('verify-step').style.display = 'block';
                            statusMsg.innerText = "Hesap bulundu! Lütfen profilinizi doğrulayın.";
                            statusMsg.style.color = "#00ff00";
                        } else {
                            statusMsg.innerText = "Hata: " + data.message;
                            statusMsg.style.color = "#ff3333";
                            loginBtn.disabled = false;
                        }
                    } catch (error) {
                        statusMsg.innerText = "Sistem hatası oluştu, tekrar deneyin.";
                        statusMsg.style.color = "#ff3333";
                        loginBtn.disabled = false;
                    }
                }

                // 2. ADIM: KODU PROFİLE YAPIŞTIRDIKTAN SONRA ÇALIŞAN DOĞRULMA FONKSİYONU
                async function profilOnayla() {
                    const statusMsg = document.getElementById('status-msg');
                    statusMsg.innerText = "Profil açıklaması kontrol ediliyor...";
                    statusMsg.style.color = "#00fff0";

                    try {
                        const response = await fetch('/api/verify-profile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: girilenUserId, generatedCode: uretilenKod })
                        });

                        const data = await response.json();

                        if (data.success) {
                            statusMsg.innerText = "Giriş Başarılı! Hesap tamamen doğrulandı.";
                            statusMsg.style.color = "#00ff00";
                        } else {
                            statusMsg.innerText = "Hata: " + data.message;
                            statusMsg.style.color = "#ff3333";
                        }
                    } catch (error) {
                        statusMsg.innerText = "Sistem hatası oluştu, tekrar deneyin.";
                        statusMsg.style.color = "#ff3333";
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// İLK AŞAMA: SADECE HESAP VAR MI KONTROLÜ YAPAN BACKEND APISI
app.post('/api/check-user', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ exists: false, message: "Eksik bilgi!" });

    try {
        const userProfileResponse = await axios.get(`https://roproxy.com{userId}`).catch(() => null);
        
        if (!userProfileResponse || !userProfileResponse.data) {
            return res.json({ exists: false, message: "Bu ID'ye ait geçerli bir Roblox hesabı bulunamadı!" });
        }

        // Hesap varsa olumlu yanıt dönüyoruz kanka
        return res.json({ exists: true });

    } catch (error) {
        return res.status(500).json({ exists: false, message: "Roblox servisleri yanıt vermiyor." });
    }
});

// İKİNCİ AŞAMA: PROFİLDEKİ KODU KONTROL EDEN BACKEND APISI
app.post('/api/verify-profile', async (req, res) => {
    const { userId, generatedCode } = req.body;
    if (!userId || !generatedCode) return res.status(400).json({ success: false, message: "Eksik bilgi!" });

    try {
        const userProfileResponse = await axios.get(`https://roproxy.com{userId}`).catch(() => null);
        if (!userProfileResponse || !userProfileResponse.data) {
            return res.json({ success: false, message: "Hesap kontrol hatası!" });
        }

        const userDescription = userProfileResponse.data.description || "";

        if (userDescription.includes(generatedCode)) {
            return res.json({ success: true });
        } else {
            return res.json({ success: false, message: "Kod profil açıklamanızda bulunamadı!" });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: "Roblox sunucu hatası." });
    }
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} üzerinde aktif.`);
});
