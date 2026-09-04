import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import pontoRoutes from './routes/pontoRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve os arquivos da pasta public
app.use(express.static('public'));

// Rotas do sistema
app.use('/auth', authRoutes);
app.use('/api/ponto', pontoRoutes);
app.use('/admin', adminRoutes);

// ROTA RAIZ: Força a entrega do index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

export default app;