import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Listar todas as solicitações pendentes
export const listarSolicitacoes = async (req: Request, res: Response) => {
  try {
    const solicitacoes = await prisma.solicitacaoCorrecao.findMany({
      where: { status: 'PENDENTE' },
      include: { colaborador: true },
    });
    return res.json(solicitacoes);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar solicitações' });
  }
};

// Aprovar ou Rejeitar solicitação
export const aprovarSolicitacao = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "APROVADO" ou "REJEITADO"

    const solicitacao = await prisma.solicitacaoCorrecao.update({
      where: { id: Number(id) },
      data: { status },
    });

    if (status === 'APROVADO') {
      await prisma.ponto.update({
        where: { id: solicitacao.pontoId! },
        data: { entrada: solicitacao.novaHora },
      });
    }

    return res.json(solicitacao);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao aprovar solicitação' });
  }
};

// Gerar relatório de horas
export const relatorioHoras = async (req: Request, res: Response) => {
  try {
    const { colaboradorId, dataInicio, dataFim } = req.query;

    const pontos = await prisma.ponto.findMany({
      where: {
        colaboradorId: Number(colaboradorId),
        entrada: {
          gte: new Date(dataInicio as string),
          lte: new Date(dataFim as string),
        },
      },
    });

    // CÓDIGO CORRIGIDO (antes estava "punto")
    const totalHoras = pontos.reduce((acc, ponto) => acc + (ponto.horasTrabalhadas || 0), 0);

    return res.json({ totalHoras, pontos });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};