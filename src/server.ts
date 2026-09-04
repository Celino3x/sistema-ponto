import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import pontoRoutes from './routes/pontoRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// CORRIGIDO: Usa o caminho da raiz do projeto (onde o public está!)
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

// Rotas do sistema
app.use('/auth', authRoutes);
app.use('/api/ponto', pontoRoutes);
app.use('/admin', adminRoutes);

// Rota raiz: Serve o index.html da pasta public (corretamente)
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

export default app;