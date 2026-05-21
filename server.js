const express = require('express');
const axios = require('axios');
const app = express();

// Render'ın vereceği portu veya yerel portu (3000) kullanıyoruz
const PORT = process.env.PORT || 3000;

// Sitenin JSON verilerini okuyabilmesi için
app.use(express.json());

// 1. ADIM: Test Rotası (Sitenin çalışıp çalışmadığını anlamak için)
app.get('/', (req, res) => {
    res.send('Robux Kazanma Sitesi Backend Sistemi Aktif!');
});

// 2. ADIM: Profil Doğrulama Sistemi (Senin bahsettiğin mantık)
app.post('/api/verify', async (req, res) => {
    const { userId, generatedCode } = req.body;

    if (!userId || !generatedCode) {
        return res.status(400).json({ error: "Eksik bilgi gönderildi!" });
    }

    try {
        // Roblox API'sinden kullanıcının profil açıklamasını çekiyoruz
        // Not: Render üzerinden giderken bazen proxy (RoProxy gibi) gerekebilir.
        const response = await axios.get(`https://roblox.com{userId}`);
        const userDescription = response.data.description || "";

        // Eğer kod açıklama kısmında varsa onaylıyoruz
        if (userDescription.includes(generatedCode)) {
            return res.json({ success: true, message: "Hesap başarıyla doğrulandı!" });
        } else {
            return res.json({ success: false, message: "Kod profil açıklamasında bulunamadı." });
        }

    } catch (error) {
        console.error("Roblox API hatası:", error.message);
        return res.status(500).json({ error: "Roblox sunucularına bağlanılamadı." });
    }
});

// Sunucuyu başlatıyoruz
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portu üzerinde çalışıyor.`);
});
