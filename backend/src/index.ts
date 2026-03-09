import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, initDB } from './db/pool';
import authRoutes from './routes/auth';
import runsRoutes from './routes/runs';
import { createInventoryRouter } from './routes/inventory';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/runs', runsRoutes);
app.use('/runs', createInventoryRouter(pool, authMiddleware));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', game: 'Schleier & Dunkel' });
});

async function main() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🎮 Server läuft auf Port ${PORT}`);
  });
}

main().catch(console.error);