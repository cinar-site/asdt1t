const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Canlıda CORS engellerini tamamen çözer

const verificationCodes = {};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'cinareymenozcelik6@gmail.com', 
        pass: 'wjsj qlbp agyl dhkk' 
    }
});

app.post('/send-code', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-posta gerekli.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    verificationCodes[email] = {
        code: code,
        expires: Date.now() + 5 * 60 * 1000 
    };

    const mailOptions = {
        from: 'cinareymenozcelik6@gmail.com',
        to: email,
        subject: 'Doğrulama Kodunuz',
        text: `Sisteme giriş için doğrulama kodunuz: ${code}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: 'E-posta gönderilemedi.' });
        }
        res.status(200).json({ message: 'Kod gönderildi.' });
    });
});

app.post('/verify-code', (req, res) => {
    const { email, code } = req.body;
    const record = verificationCodes[email];

    if (!record) return res.status(400).json({ error: 'Kod bulunamadı veya süresi doldu.' });
    if (Date.now() > record.expires) {
        delete verificationCodes[email];
        return res.status(400).json({ error: 'Kodun süresi dolmuş.' });
    }
    if (record.code !== code) return res.status(400).json({ error: 'Hatalı kod.' });

    delete verificationCodes[email];
    res.status(200).json({ success: true });
});

// Render için dinamik port ayarı
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));
