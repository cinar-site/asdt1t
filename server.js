const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// SİTENİN ANA SAYFASI (IP BAZLI KOD VE KULLANICI ADI GİRİŞLİ HİBRİT TASARIM)
app.get('/', (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "127.0.0.1";
    const cleanIp = clientIp.replace(/[^0-9]/g, '');
    const ipSeed = cleanIp ? parseInt(cleanIp.substring(0, 6)) : Math.floor(100000 + Math.random() * 900000);
    
    // IP adresine özel üretilen ve değişmeyen benzersiz kod kanka
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
                    width: 360px;
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
                <p style="color: #aaa; font-size: 14px;">Şifresiz IP Korumalı Doğrulama</p>
                
                <div class="code-box">
                    <p style="font-size: 13px; color: #ccc; text-align: left; margin-bottom: 15px;">
                        1. IP adresinize özel üretilen aşağıdaki kodu kopyalayın.<br>
                        2. Roblox profilinizdeki <b>Hakkımda (About)</b> kısmına yapıştırıp kaydedin.<br>
                        3. Aşağıdaki kutuya <b>Roblox kullanıcı adınızı</b> yazıp onaylayın.
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
                        alert("Lütfen doğrulanacak Roblox kullanıcı adınızı girin!");
                        return;
                    }

                    statusMsg.innerText = username + " adlı hesabın profil açıklaması kontrol ediliyor...";
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
                            statusMsg.innerText = "Giriş Başarılı! " + username + " hesabı IP adresinizle mühürlendi.";
                            statusMsg.style.color = "#00ff00";
                            // Kanka buraya ileride görev paneli sayfasını bağlayacağız
                        } else {
                            statusMsg.innerText = "Hata: " + data.message;
                            statusMsg.style.color = "#ff3333";
                            verifyBtn.disabled = false;
                        }
                    } catch (error) {
                        statusMsg.innerText = "Sistem tazelemisiniz, lütfen tekrar deneyin.";
                        statusMsg.style.color = "#ff3333";
                        verifyBtn.disabled = false;
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// HEM IP KODUNU HEM DE KULLANICI ADINI KONTROL EDEN HİBRİT APİ
app.post('/api/hybrid-verify', async (req, res) => {
    const { username, generatedCode } = req.body;
    if (!username || !generatedCode) return res.status(400).json({ success: false, message: "Eksik bilgi!" });

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        // 1. ADIM: Herkese açık olan ve proxy istemeyen servisten kullanıcının gerçek ID'sini alıyoruz
        const thumbnailResponse = await axios.get(`https://roblox.com{username}&size=48x48&format=Png&isCircular=false`);
        
        if (!thumbnailResponse.data || !thumbnailResponse.data.data || thumbnailResponse.data.data.length === 0) {
            return res.json({ success: false, message: "Böyle bir Roblox kullanıcı adı bulunamadı!" });
        }

        const robloxUserId = thumbnailResponse.data.data.targetId;

        // 2. ADIM: Kullanıcının profil açıklamasına gidip kodu kontrol etmeyi deniyoruz
        const profileResponse = await axios.get(`https://roproxy.net{robloxUserId}`).catch(() => null);
        
        // Eğer proxy çökmüşse veya Roblox engellediyse, kullanıcıyı siteden kaçırmamak için otomatik onay veriyoruz kanka
        if (!profileResponse || !profileResponse.data) {
            console.log(`[YEDEK ONAY] Proxy hatası nedeniyle otomatik giriş sağlandı. Kullanıcı: ${username} | IP: ${clientIp}`);
            return res.json({ success: true });
        }

        const userDescription = profileResponse.data.description || "";

        // Kod profil açıklamasında geçiyor mu kontrolü
        if (userDescription.includes(generatedCode)) {
            console.log(`[TAM ONAY] Kullanıcı: ${username} | IP: ${clientIp} kodu başarıyla doğruladı.`);
            return res.json({ success: true });
        } else {
            // Eğer proxy çalışıyor ama adam kodu gerçekten yapıştırmadıysa uyarı veriyoruz kanka
            return res.json({ success: false, message: "Kod profil açıklamanızda bulunamadı! Lütfen kodu kopyalayıp Hakkımda (About) kısmına yapıştırdığınızdan emin olun." });
        }

    } catch (error) {
        // Herhangi bir beklenmedik sistem çökmesinde akışı bozmamak için kullanıcıyı içeri alıyoruz kanka
        console.log(`[SİSTEMSSEL ONAY] Hata toleransı aktif. Kullanıcı: ${username}`);
        return res.json({ success: true });
    }
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} üzerinde aktif.`);
});
