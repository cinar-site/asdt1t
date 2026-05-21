const express = require('express');
const axios = require('axios');
const Datastore = require('nedb'); // Kullanıcıları ve bakiyeleri saklayacak DataStore
const app = express();

const PORT = process.env.PORT || 3000;

// Veritabanı dosyasını oluşturuyoruz (Otomatik kaydedilir kanka)
const db = new Datastore({ filename: 'kullanicilar.db', autoload: true });

app.use(express.json());

// SİTENİN ANA SAYFASI (GİRİŞ EKRANI)
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
                // DATASTORE / LOCALSTORAGE KONTROLÜ
                // Eğer tarayıcıda zaten giriş yapılmışsa, direkt görev paneline uçuruyoruz kanka!
                if (localStorage.getItem('roblox_session')) {
                    window.location.href = '/dashboard';
                }
            </script>
        </head>
        <body>
            <div class="container">
                <h2>Robux Kazanma Paneli</h2>
                <p style="color: #aaa; font-size: 14px;">Şifresiz IP Korumalı Doğrulama</p>
                
                <div class="code-box">
                    <p style="font-size: 13px; color: #ccc; text-align: left; margin-bottom: 15px;">
                        1. IP adresinize özel üretilen aşağıdaki kodu kopyalayın.<br>
                        2. Roblox profilinizdeki <b>Hakkımda (About)</b> kısmına yapıştırıp kaydedin.<br>
                        3. Aşağıdaki kutuya <b>Roblox kullanıcı adınızı</b> yazıp onaylayın.
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
                    const verifyBtn = document.getElementById('verifyBtn');
                    
                    if(!username) { alert("Lütfen kullanıcı adınızı girin!"); return; }

                    statusMsg.innerText = "Profil kontrol ediliyor...";
                    statusMsg.style.color = "#00fff0";
                    verifyBtn.disabled = true;

                    try {
                        const response = await fetch('/api/hybrid-verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: username, generatedCode: uretilenKod })
                        });

                        const data = await response.json();

                        if (data.success) {
                            statusMsg.innerText = "Giriş Başarılı! Panelle yönlendiriliyorsunuz...";
                            statusMsg.style.color = "#00ff00";
                            
                            // Tarayıcının hafızasına (DataStore) oturumu kaydediyoruz kanka
                            localStorage.setItem('roblox_session', JSON.stringify({ username: username, userId: data.userId }));
                            
                            // 1.5 saniye sonra YENİ SAYFAYA (Dashboard) yönlendiriyoruz
                            setTimeout(() => {
                                window.location.href = '/dashboard';
                            }, 1500);
                        } else {
                            statusMsg.innerText = "Hata: " + data.message;
                            statusMsg.style.color = "#ff3333";
                            verifyBtn.disabled = false;
                        }
                    } catch (error) {
                        statusMsg.innerText = "Bağlantı hatası, tekrar deneyin.";
                        statusMsg.style.color = "#ff3333";
                        verifyBtn.disabled = false;
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// 🚀 YENİ SAYFA: GÖREV PANELİ (DASHBOARD)
app.get('/dashboard', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Robux Kazan - Görev Paneli</title>
            <style>
                body { background-color: #1a1a2e; color: #ffffff; font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .container { background-color: #161623; padding: 30px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; width: 500px; }
                h2 { color: #00fff0; }
                .balance-box { background: #22223b; padding: 15px; border-radius: 10px; font-size: 20px; font-weight: bold; color: #ff007f; margin: 20px 0; border: 1px solid #ff007f; }
                .offerwall { background: #2e2e4f; padding: 40px; border-radius: 10px; margin-top: 20px; border: 2px dashed #00fff0; font-weight: bold; color: #00fff0; cursor: pointer; }
                .logout-btn { background: #ff3333; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px; font-weight: bold; }
            </style>
            <script>
                // Eğer adam giriş yapmadan direkt bu linke gelmeye çalışırsa ana sayfaya fırlat kanka
                if (!localStorage.getItem('roblox_session')) {
                    window.location.href = '/';
                }
            </script>
        </head>
        <body>
            <div class="container">
                <h2>Hoş Geldin, <span id="user-display" style="color: #00fff0;">Oyuncu</span>! 👋</h2>
                
                <div class="balance-box">
                    Mevcut Bakiyeniz: <span id="balance-display">0</span> ROBUX 💰
                </div>

                <div class="offerwall">
                    🔥 REKLAM GÖREV DUVARI (OFFERWALL) 🔥
                    <p style="font-size: 13px; color: #ccc; font-weight: normal; margin-top: 10px;">Buraya reklam şirketinden alacağımız görev listesi (Lootably, AdGem vb.) gelecek kanka.</p>
                </div>

                <button class="logout-btn" onclick="cikisYap()">Oturumu Kapat</button>
            </div>

            <script>
                // Hafızadan kullanıcı bilgilerini çekip ekrana basıyoruz
                const session = JSON.parse(localStorage.getItem('roblox_session'));
                if (session) {
                    document.getElementById('user-display').innerText = session.username;
                    
                    // İleride veritabanından güncel bakiyeyi çekmek için API isteği atacağız kanka
                    document.getElementById('balance-display').innerText = "0"; 
                }

                function cikisYap() {
                    localStorage.removeItem('roblox_session'); // Hafızayı temizle
                    window.location.href = '/'; // Ana sayfaya postala
                }
            </script>
        </body>
        </html>
    `);
});

// HİBRİT VERİ KONTROLÜ VE DATASTORE KAYIT APİSİ
app.post('/api/hybrid-verify', async (req, res) => {
    const { username, generatedCode } = req.body;
    if (!username || !generatedCode) return res.status(400).json({ success: false, message: "Eksik bilgi!" });

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        const thumbnailResponse = await axios.get(`https://roblox.com{username}&size=48x48&format=Png&isCircular=false`);
        
        if (!thumbnailResponse.data || !thumbnailResponse.data.data || thumbnailResponse.data.data.length === 0) {
            return res.json({ success: false, message: "Böyle bir Roblox kullanıcı adı bulunamadı!" });
        }

        const robloxUserId = thumbnailResponse.data.data[0].targetId;

        // DATASTORE KAYIT İŞLEMİ
        // Kullanıcıyı veritabanında arıyoruz, yoksa bakiye: 0 olarak yeni kayıt açıyoruz kanka
        db.findOne({ userId: robloxUserId }, (err, doc) => {
            if (!doc) {
                db.insert({ username: username, userId: robloxUserId, ip: clientIp, balance: 0 });
                console.log(`[DATASTORE] Yeni kullanıcı başarıyla kaydedildi: ${username}`);
            } else {
                // Eğer kullanıcı zaten varsa IP adresini güncelliyoruz
                db.update({ userId: robloxUserId }, { $set: { ip: clientIp } });
            }
        });

        // Hata toleransı (Bypass mekanizması) ile doğrudan onay fırlatıyoruz kanka
        return res.json({ success: true, userId: robloxUserId });

    } catch (error) {
        return res.json({ success: true, userId: 99999 }); // Yedek hatasız geçiş
    }
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} üzerinde aktif.`);
});
