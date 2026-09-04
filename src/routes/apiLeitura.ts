import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// ===================== VERIFICAR AUTH BEARER =====================
function verificarApiKey(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'Acesso negado: Token ausente ou formato inválido' });
  }
  const token = authHeader.split(' ')[1];
  if (token !== process.env.SE_READ_API_KEY) {
    return res.status(403).json({ error: 'Acesso negado: API Key inválida' });
  }
  next();
}

// ===================== CONSULTAR COLABORADORES (TODOS) =====================
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

    // Retorna TODOS os colaboradores (array completo)
    return res.json({ colaboradores: colaboradores });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao consultar colaboradores' });
  }
});

export default router;