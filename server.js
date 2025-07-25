// server.js

import dotenv from 'dotenv';
dotenv.config(); // .env লোড

import connectDB from './src/config/db.js'; // MongoDB কানেকশন
connectDB(); // ফাংশন কল

import app from './src/app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`🌐 Access backend at: http://localhost:${PORT}`);
    console.log(`🔓 CORS allowed for: ${process.env.CLIENT_URL}`);
});
