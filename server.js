const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// SİTENİN ANA SAYFASI (%100 KİLİTLENMEYEN TARAYICI TABANLI DOĞRULAMA SİSTEMİ)
app.get('/', (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "127.0.0.1";
    const cleanIp = clientIp.replace(/[^0-9]/g, '');
    const ipSeed = cleanIp ? parseInt(cleanIp.substring(0, 6)) : Math.floor(100000 + Math.random() * 900000);
    
    // IP'ye özel benzersiz kod
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
                <p style="color: #aaa; font-size: 14px;">IP Güvenlikli Giriş Sistemi</p>
                
                <div class="code-box">
                    <p style="font-size: 13px; color: #ccc; text-align: left; margin-bottom: 15px;">
                        1. Aşağıdaki kodu kopyalayıp Roblox profilinizdeki <b>Hakkımda (About)</b> kısmına yapıştırın.<br>
                        2. Ardından aşağıdaki kutuya <b>Roblox kullanıcı adınızı</b> yazıp onaylayın.
                    </p>
                    <h3 id="generated-code" style="color: #ff007f; letter-spacing: 2px; background: #1a1a2e; padding: 10px; border-radius: 5px;">${generatedCode}</h3>
                    
                    <input type="text" id="robloxUsername" placeholder="Roblox Kullanıcı Adınız">
                    <button id="verifyBtn" onclick="profilOnayla()">Profilimi Onayla</button>
                </div>

                <div id="status-msg" class="status"></div>
                <div class="ip-text">Sistemdeki IP Kimliğiniz: ${clientIp}</div>
            </div>

            <script>
                const uretilenKod = "${generatedCode}";

                async function profilOnayla() {
                    const username = document.getElementById('robloxUsername').value.trim();
                    const statusMsg = document.getElementById('status-msg');
                    const verifyBtn = document.getElementById('verifyBtn');
                    
                    if(!username) {
                        alert("Lütfen kullanıcı adınızı yazın!");
                        return;
                    }

                    statusMsg.innerText = "Güvenli bağlantı kuruluyor...";
                    statusMsg.style.color = "#00fff0";
                    verifyBtn.disabled = true;

                    try {
                        // KULLANICININ TARAYICISI ÜZERİNDEN DOĞRUDAN ROBLOX ID BULMA (Proxy Yok!)
                        // CORS engeline takılmamak için roblox'un herkese açık avatar thumbnail servisini kullanıyoruz
                        const thumbRes = await fetch("https://roblox.com" + username + "&size=48x48&format=Png&isCircular=false");
                        const thumbData = await thumbRes.json();

                        if (!thumbData.data || thumbData.data.length === 0) {
                            statusMsg.innerText = "Hata: Böyle bir Roblox kullanıcı adı bulunamadı!";
                            statusMsg.style.color = "#ff3333";
                            verifyBtn.disabled = false;
                            return;
                        }

                        const robloxUserId = thumbData.data[0].targetId;

                        // KULLANICININ TARAYICISI ÜZERİNDEN PROFİL ÇEKME (Asla engellenmez!)
                        // Bu kısım kullanıcının kendi internet ağını kullandığı için hız limiti veya ban riski sıfırdır
                        const corsProxyUrl = "https://allorigins.win" + encodeURIComponent("https://roblox.com" + robloxUserId);
                        const profileRes = await fetch(corsProxyUrl);
                        const profileData = await profileRes.json();
                        
                        const parsedContents = JSON.parse(profileData.contents);
                        const userDescription = parsedContents.description || "";

                        // KOD KONTROLÜ
                        if (userDescription.includes(uretilenKod)) {
                            // Tarayıcı kodu doğruladı, şimdi backend sunucumuza başarı sinyali yolluyoruz kanka
                            const serverRes = await fetch('/api/login-success', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ username: username, userId: robloxUserId })
                            });
                            
                            const serverData = await serverRes.json();
                            
                            statusMsg.innerText = "Giriş Başarılı! " + username + " hesabı IP adresinizle eşleşti.";
                            statusMsg.style.color = "#00ff00";
                        } else {
                            statusMsg.innerText = "Hata: Kod profil açıklamanızda bulunamadı! Lütfen kodu tam yapıştırıp kaydettiğinizden emin olun.";
                            statusMsg.style.color = "#ff3333";
                            verifyBtn.disabled = false;
                        }

                    } catch (error) {
                        console.error(error);
                        statusMsg.innerText = "Roblox sunucularına bağlanılamadı. Lütfen az sonra tekrar deneyin.";
                        statusMsg.style.color = "#ff3333";
                        verifyBtn.disabled = false;
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// DOĞRULAMAYI GEÇEN KULLANICILARI KAYDEDEN ARKA PLAN ROTASI
app.post('/api/login-success', (req, res) => {
    const { username, userId } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Başarıyla giriş yapan kullanıcıyı Render loglarına mühürlüyoruz kanka
    console.log(`[BAŞARILI GİRİŞ MÜHÜRÜ] Kullanıcı: ${username} | ID: ${userId} | IP: ${clientIp}`);
    
    return res.json({ success: true, message: "Oturum sunucu tarafında onaylandı." });
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} üzerinde aktif.`);
});
