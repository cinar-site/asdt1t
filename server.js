const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// SİTENİN ANA SAYFASI (HTML & CSS)
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
                <p style="color: #aaa; font-size: 14px;">Roblox Kullanıcı Adı ile Güvenli Giriş</p>
                
                <div id="login-step">
                    <input type="text" id="usernameInput" placeholder="Roblox Kullanıcı Adı">
                    <button id="loginBtn" onclick="isimKontrolEt()">Giriş Yap</button>
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
                let bulunanUserId = "";

                async function isimKontrolEt() {
                    const username = document.getElementById('usernameInput').value.trim();
                    const statusMsg = document.getElementById('status-msg');
                    const loginBtn = document.getElementById('loginBtn');
                    
                    if(!username) {
                        alert("Lütfen Roblox kullanıcı adınızı girin!");
                        return;
                    }
                    
                    statusMsg.innerText = "Kullanıcı adı kontrol ediliyor...";
                    statusMsg.style.color = "#00fff0";
                    loginBtn.disabled = true;

                    try {
                        const response = await fetch('/api/check-username', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: username })
                        });

                        const data = await response.json();

                        if (data.exists) {
                            bulunanUserId = data.userId;
                            uretilenKod = "ROBUX-" + Math.floor(100000 + Math.random() * 900000);
                            
                            document.getElementById('generated-code').innerText = uretilenKod;
                            document.getElementById('login-step').style.display = 'none';
                            document.getElementById('verify-step').style.display = 'block';
                            statusMsg.innerText = "Hesap doğrulandı! Kod profilinize eklensin.";
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

                async function profilOnayla() {
                    const statusMsg = document.getElementById('status-msg');
                    statusMsg.innerText = "Profil açıklaması kontrol ediliyor...";
                    statusMsg.style.color = "#00fff0";

                    try {
                        const response = await fetch('/api/verify-profile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: bulunanUserId, generatedCode: uretilenKod })
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

// ROBLOX KULLANICI ADI KONTROLÜ (GÜNCELLENMİŞ VE KARARLI HALE GETİRİLMİŞ API)
app.post('/api/check-username', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ exists: false, message: "Eksik bilgi!" });

    try {
        // Stabilizasyon için roproxy.net adresine yönlendirdik kanka
        const response = await axios.post('https://roproxy.net', {
            usernames: [username],
            excludeBannedUsers: false
        });

        // Gelen veri paketinin yapısını tamamen güvenli şekilde açıyoruz kanka
        if (response.data && response.data.data && response.data.data.length > 0) {
            const robloxUser = response.data.data[0]; // İlk eşleşen elemanı al
            return res.json({ exists: true, userId: robloxUser.id }); // Eşleşen ID'yi fırlat
        } else {
            return res.json({ exists: false, message: "Böyle bir Roblox kullanıcı adı bulunamadı!" });
        }
    } catch (error) {
        console.error("Roblox API Hatası:", error.message);
        return res.json({ exists: false, message: "Roblox sunucuları veya proxy şu an yoğun. Lütfen tekrar deneyin." });
    }
});

// PROFİLDEKİ KODU KONTROL EDEN APİ
app.post('/api/verify-profile', async (req, res) => {
    const { userId, generatedCode } = req.body;
    if (!userId || !generatedCode) return res.status(400).json({ success: false, message: "Eksik bilgi!" });

    try {
        const response = await axios.get(`https://roproxy.net{userId}`);
        const userDescription = response.data.description || "";

        if (userDescription.includes(generatedCode)) {
            return res.json({ success: true });
        } else {
            return res.json({ success: false, message: "Kod profil açıklamanızda bulunamadı! Lütfen kodu tam kaydettiğinizden emin olun." });
        }
    } catch (error) {
        return res.json({ success: false, message: "Profil açıklaması çekilirken hata oluştu." });
    }
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} üzerinde aktif.`);
});
