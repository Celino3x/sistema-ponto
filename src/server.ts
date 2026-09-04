import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import pontoRoutes from './routes/pontoRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
const PORT = 3000;

app.use(cors());
// AUMENTA O LIMITE DE TAMANHO DO JSON PARA 50MB (para receber anexos em Base64)
app.use(express.json({ limit: '50mb' })); 

// SERVE OS ARQUIVOS HTML DA PASTA PUBLIC
app.use(express.static('public'));

// Rotas do sistema
app.use('/auth', authRoutes);
app.use('/api/ponto', pontoRoutes);
app.use('/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:3000`);
});