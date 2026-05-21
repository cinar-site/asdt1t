const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// SİTENİN ANA SAYFASI (HTML & CSS)
app.get('/', (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "127.0.0.1";
    const cleanIp = clientIp.replace(/[^0-9]/g, '');
    const ipSeed = cleanIp ? parseInt(cleanIp.substring(0, 6)) : Math.floor(100000 + Math.random() * 900000);
    
    // IP'ye özel değişmeyen benzersiz kod
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
                input {
                    width: 90%;
                    padding: 12px;
                    margin: 15px 0 10px 0;
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
                <p style="color: #aaa; font-size: 14px;">IP Adresiniz ve Kodunuz Hazır</p>
                
                <div class="code-box">
                    <p style="font-size: 13px; color: #ccc; text-align: left; margin-bottom: 15px;">
                        1. Aşağıdaki kodu kopyalayıp Roblox profilinizdeki <b>Hakkımda (About)</b> kısmına yapıştırın.<br>
                        2. Ardından aşağıdaki kutuya <b>Roblox kullanıcı adınızı</b> yazıp onaylayın.
                    </p>
                    <h3 id="generated-code" style="color: #ff007f; letter-spacing: 2px; background: #1a1a2e; padding: 10px; border-radius: 5px;">${generatedCode}</h3>
                    
                    <input type="text" id="robloxUsername" placeholder="Roblox Kullanıcı Adınız">
                    <button onclick="profilOnayla()" style="background-color: #ff007f; color: #fff;">Profilimi Onayla</button>
                </div>

                <div id="status-msg" class="status"></div>
                <div class="ip-text">Sistemdeki IP Kimliğiniz: ${clientIp}</div>
            </div>

            <script>
                const uretilenKod = "${generatedCode}";

                async function profilOnayla() {
                    const username = document.getElementById('robloxUsername').value.trim();
                    const statusMsg = document.getElementById('status-msg');
                    
                    if(!username) {
                        alert("Lütfen profilinizi kontrol edebilmemiz için Roblox kullanıcı adınızı yazın!");
                        return;
                    }

                    statusMsg.innerText = username + " adlı hesabın profili inceleniyor...";
                    statusMsg.style.color = "#00fff0";

                    try {
                        const response = await fetch('/api/verify-user-profile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: username, generatedCode: uretilenKod })
                        });

                        const data = await response.json();

                        if (data.success) {
                            statusMsg.innerText = "Giriş Başarılı! " + username + " hesabı IP kimliğinizle doğrulandı.";
                            statusMsg.style.color = "#00ff00";
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

// NOKTA ATIŞI HESAP VE KOD KONTROLÜ YAPAN EN STABİL APİ
app.post('/api/verify-user-profile', async (req, res) => {
    const { username, generatedCode } = req.body;
    if (!username || !generatedCode) return res.status(400).json({ success: false, message: "Eksik bilgi!" });

    try {
        // 1. ADIM: Proxy'ye takılmayan açık servis ile kullanıcı adından ID bulma
        const thumbnailResponse = await axios.get(`https://roblox.com{username}&size=48x48&format=Png&isCircular=false`);
        
        if (!thumbnailResponse.data || !thumbnailResponse.data.data || thumbnailResponse.data.data.length === 0) {
            return res.json({ success: false, message: "Böyle bir Roblox kullanıcı adı bulunamadı!" });
        }

        const robloxUserId = thumbnailResponse.data.data[0].targetId;
        if (!robloxUserId) {
            return res.json({ success: false, message: "Kullanıcı kimliği çözülemedi." });
        }

        // 2. ADIM: Doğrudan o ID'nin profiline gidip kodu kontrol etme (Tüm dünyayı aramaktan 100 kat daha stabil)
        const profileResponse = await axios.get(`https://roproxy.net{robloxUserId}`).catch(() => null);
        
        if (!profileResponse || !profileResponse.data) {
            return res.json({ success: false, message: "Roblox profil kontrol servisi şu an yanıt vermiyor. Lütfen 5 saniye sonra tekrar deneyin." });
        }

        const userDescription = profileResponse.data.description || "";

        // Kod eşleşiyor mu kontrolü
        if (userDescription.includes(generatedCode)) {
            return res.json({ success: true });
        } else {
            return res.json({ success: false, message: "Kod profil açıklamanızda bulunamadı! Lütfen kodu tam yapıştırıp kaydettiğinizden emin olun." });
        }

    } catch (error) {
        console.error("Sistem Hatası:", error.message);
        return res.json({ success: false, message: "Teknik bir aksaklık yaşandı. Lütfen birazdan tekrar deneyin." });
    }
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} üzerinde aktif.`);
});
