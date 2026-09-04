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

// ===================== CONSULTAR COLABORADORES =====================
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
    return res.json(colaboradores);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao consultar colaboradores' });
  }
});

// ===================== CONSULTAR PONTOS (COM DATAS) =====================
router.get('/pontos', verificarApiKey, async (req: any, res: any) => {
  try {
    const { dataInicio, dataFim, colaboradorId } = req.query;
    
    const pontos = await prisma.ponto.findMany({
      where: {
        ...(colaboradorId ? { colaboradorId: Number(colaboradorId) } : {}),
        entrada: {
          gte: new Date(dataInicio as string || '2024-01-01'),
          lte: new Date(dataFim as string || '2030-12-31')
        }
      },
      include: {
        colaborador: {
          select: {
            nome: true,
            matricula: true,
            funcao: true,
            area: true
          }
        }
      }
    });

    return res.json(pontos);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao consultar pontos' });
  }
});

// ===================== CONSULTAR HORAS TOTAIS =====================
router.get('/horas-totais', verificarApiKey, async (req: any, res: any) => {
  try {
    const { dataInicio, dataFim, colaboradorId } = req.query;

    const pontos = await prisma.ponto.findMany({
      where: {
        ...(colaboradorId ? { colaboradorId: Number(colaboradorId) } : {}),
        entrada: {
          gte: new Date(dataInicio as string || '2024-01-01'),
          lte: new Date(dataFim as string || '2030-12-31')
        }
      },
      include: {
        colaborador: {
          select: {
            nome: true,
            matricula: true,
            funcao: true,
            area: true
          }
        }
      }
    });

    const totalHoras = pontos.reduce((acc, ponto) => acc + (ponto.horasTrabalhadas || 0), 0);

    return res.json({ totalHoras, pontos });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao consultar horas totais' });
  }
});

export default router;