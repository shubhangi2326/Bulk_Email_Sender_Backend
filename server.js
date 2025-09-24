// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/connectDB.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'https://bulk-email-sender-frontend.vercel.app' 
}));
app.use(express.json());

// Routes
app.use('/api', uploadRoutes);

app.get('/', (req, res) => {
  res.status(200).send('<h1>Bulk Email Sender Backend is running!</h1><p>API is available at /api/upload-and-send</p>');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
