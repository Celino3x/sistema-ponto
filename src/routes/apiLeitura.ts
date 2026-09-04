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

// ===================== CONSULTAR COLABORADORES (APENAS 1 OBJETO) =====================
router.get('/colaboradores', verificarApiKey, async (req: any, res: any) => {
  try {
    // Retorna apenas o PRIMEIRO colaborador como exemplo, e como UM OBJETO ÚNICO
    const primeiroColaborador = await prisma.colaborador.findFirst({
      select: {
        id: true,
        nome: true,
        matricula: true,
        funcao: true,
        area: true,
        usuario: true
      }
    });

    // Estrutura: "colaboradores" é um OBJETO, não um array.
    return res.json({ colaboradores: premierColaborador });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao consultar colaboradores' });
  }
});

export default router;