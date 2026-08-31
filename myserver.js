require('dotenv').config();
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const app = express();
const port =3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER || 'fanwelmawelejunior@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'contact.html'));
});
app.get('/solutions', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'solutions.html'));
});
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'about.html'));
});
app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'services.html'));
}); 
app.post('/submit', async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim();
  const cleanSubject = String(subject || '').trim();
  const cleanMessage = String(message || '').trim();

  if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
    return res.status(400).json({
      message: 'Please complete the name, email, subject and message fields.',
    });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(cleanEmail)) {
    return res.status(400).json({
      message: 'Please provide a valid email address.',
    });
  }

  if (cleanSubject.length > 100) {
    return res.status(400).json({
      message: 'Please keep the subject shorter.',
    });
  }

  if (cleanMessage.length < 6) {
    return res.status(400).json({
      message: 'Please provide a little more detail in your message.',
    });
  }

  if (cleanMessage.length > 4000) {
    return res.status(400).json({
      message: 'Your message is too long. Please shorten it and try again.',
    });
  }

  try {
    await pool.query(
      'INSERT INTO contacts (name, email, subject, message) VALUES ($1, $2, $3, $4)',
      [cleanName, cleanEmail, cleanSubject, cleanMessage]
    );

    if (process.env.GMAIL_APP_PASSWORD) {
      await transporter.sendMail({
        from: '"Fanwell Tech Labs" <fanwelmawelejunior@gmail.com>',
        to: 'fanwelmawelejunior@gmail.com',
        replyTo: cleanEmail,
        subject: `New message from ${cleanName} - FanwellTechLabs`,
        text: `Name: ${cleanName}\nEmail: ${cleanEmail}\nSubject: ${cleanSubject}\nMessage: ${cleanMessage}`,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Thanks! Your message has been sent successfully.',
    });
  } catch (error) {
    console.error('Error in /submit:', error);
    return res.status(500).json({
      message: 'There was a problem sending your message. Please try again in a moment.',
    });
  }
});

async function startServer() {
  // await ensureContactTable();

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
