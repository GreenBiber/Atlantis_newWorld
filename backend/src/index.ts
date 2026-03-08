import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db/pool';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', game: 'Schleier & Dunkel' });
});

// Start
async function main() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🎮 Server läuft auf Port ${PORT}`);
  });
}

main().catch(console.error);