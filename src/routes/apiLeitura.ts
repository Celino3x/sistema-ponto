import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// ===================== VERIFICAR API KEY =====================
function verificarApiKey(req: any, res: any, next: any) {
  // Aceita a chave em qualquer um desses cabeçalhos
  const apiKey = req.headers['x-api-key'] || req.headers['apikey'] || req.headers['api_key'];
  
  if (apiKey !== process.env.SE_READ_API_KEY) {
    return res.status(403).json({ error: 'Acesso negado: API Key inválida' });
  }
  next();
}

// ===================== CONSULTAR COLABORADORES =====================
router.get('/colaboradores', verificarApiKey, async (req: any, res: any) => {
  try {
    const primeiroColaborador = await prisma.colaborador.findFirst({
      where: {
        funcao: { not: null },
        area: { not: null }
      },
      select: {
        id: true,
        nome: true,
        matricula: true,
        funcao: true,
        area: true,
        usuario: true
      }
    });

    // Retorna como objeto (uma chave para o SoftExpert aprender)
    return res.json({ colaboradores: primeiroColaborador });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao consultar colaboradores' });
  }
});

export default router;