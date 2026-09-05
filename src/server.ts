import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import pontoRoutes from './routes/pontoRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve os arquivos da pasta public
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

// Rotas do sistema
app.use('/auth', authRoutes);
app.use('/api/ponto', pontoRoutes);

// Rota raiz: Serve o index.html da pasta public
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

// INICIA O SERVIDOR
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});