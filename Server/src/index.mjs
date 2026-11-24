import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connexion a MongoDB avec la variable d'environnement MONGO_URI
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mern';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Connecte a MongoDB : ' + MONGO_URI))
  .catch((err) => console.error('Erreur MongoDB :', err.message));

app.get('/api/health', (req, res) => {
  res.json({
    message: 'API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));