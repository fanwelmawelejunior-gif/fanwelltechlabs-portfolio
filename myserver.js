require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(100),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Contacts table ready');
  } catch (err) {
    console.error('Error creating table:', err.message);
  }
})();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "fanwelmawelejunior@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

app.get('/health', (req, res) => res.send('Server is running!'));

app.post('/submit', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send('Please fill in all fields.');
  }

  try {
    await pool.query(
      'INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3)',
      [name, email, message]
    );

    await transporter.sendMail({
      from: '"fanwelltechlabs" <fanwelmawelejunior@gmail.com>',
      to: "fanwelmawelejunior@gmail.com",
      replyTo: email,
      subject: `New message from ${name} - FanwellTechLabs`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    });

    console.log("EMAIL SENT SUCCESSFULLY");

    res.status(200).send('Message received successfully. We will contact you.');

  } catch (err) {
    console.error('Error in /submit:', err);
    res.status(500).send('Error saving message or sending email.');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
