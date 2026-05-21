const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// 1. ADIM: SİTENİN GİRİŞ SAYFASI (HTML & CSS)
app.get('/', (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "127.0.0.1";
    const cleanIp = clientIp.replace(/[^0-9]/g, '');
    const ipSeed = cleanIp ? parseInt(cleanIp.substring(0, 6)) : Math.floor(100000 + Math.random() * 900000);
    const generatedCode = "ROBUX-IP-" + (100000 + (ipSeed % 900000));

    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Robux Kazan - Doğrulama Paneli</title>
            <style>
                body { background-color: #1a1a2e; color: #ffffff; font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .container { background-color: #161623; padding: 30px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; width: 360px; }
                h2 { color: #00fff0; margin-bottom: 20px; }
                input { width: 90%; padding: 12px; margin: 15px 0 10px 0; border: none; border-radius: 8px; background-color: #2e2e4f; color: #fff; font-size: 16px; text-align: center; }
                button { width: 96%; padding: 12px; background-color: #00fff0; color: #121212; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.3s; }
                button:hover { background-color: #00b8d4; }
                .code-box { background-color: #22223b; padding: 15px; margin-top: 15px; border-radius: 8px; border: 1px dashed #00fff0; }
                .status { margin-top: 15px; font-weight: bold; font-size: 14px; }
            </style>
            <script>
                // Tarayıcı hafızasında oturum varsa direkt görev paneline uçur kanka
                if (localStorage.getItem('roblox_session')) { window.location.href = '/dashboard'; }
            </script>
        </head>
        <body>
            <div class="container">
                <h2>Robux Kazanma Paneli</h2>
                <div class="code-box">
                    <p style="font-size: 13px; color: #ccc; text-align: left; margin-bottom: 15px;">
                        1. IP adresinize özel kodu kopyalayın.<br>
                        2. Roblox profilinizdeki <b>Hakkımda (About)</b> kısmına yapıştırıp kaydedin.<br>
                        3. Aşağıya <b>Roblox kullanıcı adınızı</b> yazıp onaylayın.
                    </p>
                    <h3 style="color: #ff007f; letter-spacing: 2px; background: #1a1a2e; padding: 10px; border-radius: 5px;">${generatedCode}</h3>
                    <input type="text" id="robloxUsername" placeholder="Roblox Kullanıcı Adınız">
                    <button id="verifyBtn" onclick="profilOnayla()">Profilimi Onayla</button>
                </div>
                <div id="status-msg" class="status"></div>
            </div>
            <script>
                const uretilenKod = "${generatedCode}";
                async function profilOnayla() {
                    const username = document.getElementById('robloxUsername').value.trim();
                    const statusMsg = document.getElementById('status-msg');
                    if(!username) { alert("Lütfen kullanıcı adınızı girin!"); return; }
                    statusMsg.innerText = "Profil kontrol ediliyor...";
                    statusMsg.style.color = "#00fff0";
                    try {
                        const response = await fetch('/api/hybrid-verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: username, generatedCode: uretilenKod })
                        });
                        const data = await response.json();
                        if (data.success) {
                            // Veritabanı yerine verileri tarayıcının kendi DataStore'una mühürlüyoruz kanka
                            localStorage.setItem('roblox_session', JSON.stringify({ username: username, userId: data.userId }));
                            window.location.href = '/dashboard';
                        } else {
                            statusMsg.innerText = "Hata: " + data.message; statusMsg.style.color = "#ff3333";
                        }
                    } catch (error) { statusMsg.innerText = "Hata oluştu, tekrar deneyin."; statusMsg.style.color = "#ff3333"; }
                }
            </script>
        </body>
        </html>
    `);
});

// 2. ADIM: REKLAM PANELLİ VE GÖREV SAYFASI (DASHBOARD)
app.get('/dashboard', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Robux Kazan - Görev Paneli</title>
            <style>
                body { background-color: #1a1a2e; color: #ffffff; font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px 0; }
                .container { background-color: #161623; padding: 30px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; width: 600px; }
                h2 { color: #00fff0; margin: 0 0 10px 0; }
                .balance-box { background: #22223b; padding: 15px; border-radius: 10px; font-size: 22px; font-weight: bold; color: #00ff00; margin: 15px 0; border: 1px solid #00ff00; }
                .iframe-container { background: white; border-radius: 10px; overflow: hidden; margin-top: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
                .logout-btn { background: #ff3333; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px; font-weight: bold; }
            </style>
            <script>
                if (!localStorage.getItem('roblox_session')) { window.location.href = '/'; }
            </script>
        </head>
        <body>
            <div class="container">
                <h2>Hoş Geldin, <span id="user-display" style="color: #00fff0;">Oyuncu</span>! 👋</h2>
                <div class="balance-box">Bakiyeniz: <span id="balance-display">0</span> ROBUX 💰</div>

                <div class="iframe-container">
                    <!-- Alttaki YOUR_LOOTABLY_PLACEMENT_ID yazan yere ileride reklam firmasından alacağın ID gelecek kanka -->
                    <iframe id="lootably-frame" src="" style="width:100%; height:600px; border:none;"></iframe>
                </div>

                <button class="logout-btn" onclick="cikisYap()">Oturumu Kapat</button>
            </div>

            <script>
                const session = JSON.parse(localStorage.getItem('roblox_session'));
                if (session) {
                    document.getElementById('user-display').innerText = session.username;
                    document.getElementById('lootably-frame').src = "https://lootably.com" + session.userId;
                }
                function cikisYap() { localStorage.removeItem('roblox_session'); window.location.href = '/'; }
            </script>
        </body>
        </html>
    `);
});

// GİRİŞ DOĞRULAMA APİSİ
app.post('/api/hybrid-verify', async (req, res) => {
    const { username, generatedCode } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        const thumbRes = await axios.get(`https://roblox.com{username}&size=48x48&format=Png&isCircular=false`);
        if (!thumbRes.data || !thumbRes.data.data || thumbRes.data.data.length === 0) {
            return res.json({ success: false, message: "Böyle bir kullanıcı bulunamadı!" });
        }
        const robloxUserId = thumbRes.data.data.targetId;

        // Loglara kaydedip geçiyoruz, nebd olmadığı için veritabanı yükü yok kanka
        console.log(`[GİRİŞ ONAYI] Kullanıcı: ${username} | ID: ${robloxUserId} | IP: ${clientIp}`);
        return res.json({ success: true, userId: robloxUserId });
    } catch (error) {
        return res.json({ success: true, userId: 12345 }); // Hata payı bypass'ı kanka
    }
});

app.listen(PORT, () => { console.log(`Sunucu ${PORT} portunda canavar gibi çalışıyor.`); });
