import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// ===================== VERIFICAR AUTH BEARER =====================
function verificarApiKey(req: any, res: any, next: any) {
  // Pega o Header "Authorization"
  const authHeader = req.headers['authorization'];
  
  // Formato esperado: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'Acesso negado: Token ausente ou formato inválido' });
  }

  // Extrai o token (remove o "Bearer ")
  const token = authHeader.split(' ')[1];

  // Compara com o valor da variável de ambiente
  if (token !== process.env.SE_READ_API_KEY) {
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

    // Retorna como objeto (para o SoftExpert "aprender")
    return res.json({ colaboradores: primeiroColaborador });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao consultar colaboradores' });
  }
});

export default router;