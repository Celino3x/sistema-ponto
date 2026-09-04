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

// CAMINHO ABSOLUTO: Encontra a pasta 'public' na raiz do projeto (ao lado da pasta 'src' e 'api')
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Rotas do sistema
app.use('/auth', authRoutes);
app.use('/api/ponto', pontoRoutes);
app.use('/admin', adminRoutes);

// Rota raiz: Serve o index.html da pasta public
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

export default app;