import express from 'express';
import cors from 'cors';
import pontoRoutes from './routes/pontoRoutes';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/ponto', pontoRoutes);

app.get('/', (req, res) => {
  res.send('🟢 Sistema de Ponto rodando!');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});