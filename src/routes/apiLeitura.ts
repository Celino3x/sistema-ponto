import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// ===================== VERIFICAR API KEY =====================
function verificarApiKey(req: any, res: any, next: any) {
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey !== process.env.SE_READ_API_KEY) {
    return res.status(403).json({ error: 'Acesso negado: API Key inválida' });
  }
  next();
}

// ===================== CONSULTAR COLABORADORES (OBJETO JSON) =====================
router.get('/colaboradores', verificarApiKey, async (req: any, res: any) => {
  try {
    const colaboradores = await prisma.colaborador.findMany({
      select: {
        id: true,
        nome: true,
        matricula: true,
        funcao: true,
        area: true,
        usuario: true
      }
    });
    // <-- RETORNA COMO OBJETO (COM CHAVE "colaboradores")
    return res.json({ colaboradores });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao consultar colaboradores' });
  }
});

export default router;