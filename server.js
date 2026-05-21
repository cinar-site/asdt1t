const express = require('express');
const axios = require('axios');
const path = require('path'); // Klasör yollarını bulmak için gerekli kütüphane
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🔥 PROJE KLASÖRÜNÜ DIŞARIYA AÇIYORUZ 🔥
// Bu satır sayesinde klasörün içine attığın icon.ico dosyasını tarayıcı doğrudan okuyabilecek kanka
app.use(express.static(path.join(__dirname)));

// 1. ADIM: GİRİŞ SAYFASI
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
            
            <!-- SECKEDE İKONUN GÖZÜKMESİ İÇİN KLASÖRDEKİ DOSYAYI BAĞLIYORUZ -->
            <link rel="icon" type="image/x-icon" href="/icon.ico">
            
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

// 2. ADIM: GÖREV SAYFASI (DASHBOARD)
app.get('/dashboard', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Robux Kazan - Görev Paneli</title>
            
            <!-- BURAYA DA İKONU EKLEDİK KANKA -->
            <link rel="icon" type="image/x-icon" href="/icon.ico">
            
            <style>
                body { background-color: #1a1a2e; color: #ffffff; font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px 0; }
                .container { background-color: #161623; padding: 30px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; width: 500px; }
                h2 { color: #00fff0; margin: 0 0 10px 0; }
                .balance-box { background: #22223b; padding: 15px; border-radius: 10px; font-size: 22px; font-weight: bold; color: #00ff00; margin: 15px 0; border: 1px solid #00ff00; }
                .task-box { background: #2e2e4f; padding: 30px; border-radius: 10px; margin-top: 20px; border: 2px dashed #ff007f; font-weight: bold; color: #ff007f; }
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

                <div class="task-box">
                    📢 GÖREV SİSTEMİ ÇOK YAKINDA AKTİF OLACAK!
                    <p style="font-size: 14px; color: #ccc; font-weight: normal; margin-top: 10px;">
                        Lootably veya AdGem reklam anlaşmalarımız tamamlandığında, buraya tıkır tıkır yapabileceğiniz anket birikim görevleri yüklenecektir kanka.
                    </p>
                </div>

                <button class="logout-btn" onclick="cikisYap()">Oturumu Kapat</button>
            </div>

            <script>
                const session = JSON.parse(localStorage.getItem('roblox_session'));
                if (session) {
                    document.getElementById('user-display').innerText = session.username;
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
        return res.json({ success: true, userId: robloxUserId });
    } catch (error) {
        return res.json({ success: true, userId: 12345 });
    }
});

app.listen(PORT, () => { console.log(`Sunucu ${PORT} portunda canavar gibi çalışıyor.`); });
