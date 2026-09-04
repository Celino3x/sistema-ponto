import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Bater o ponto (Entrada ou Saída)
export const registrarPonto = async (req: Request, res: Response) => {
  try {
    const colaboradorId = req.userId;
    const agora = new Date();

    const pontoAberto = await prisma.ponto.findFirst({
      where: { colaboradorId, saida: null },
    });

    if (!pontoAberto) {
      const ponto = await prisma.ponto.create({
        data: { colaboradorId, entrada: agora },
      });
      return res.status(201).json({ message: 'Entrada registrada!', punto: ponto });
    } else {
      const horasTrabalhadas = (agora.getTime() - pontoAberto.entrada.getTime()) / (1000 * 60 * 60);
      
      const ponto = await prisma.ponto.update({
        where: { id: pontoAberto.id },
        data: { saida: agora, horasTrabalhadas },
      });
      return res.json({ message: 'Saída registrada!', ponto });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao registrar ponto' });
  }
};

// Listar o histórico do colaborador logado
export const listarHistorico = async (req: Request, res: Response) => {
  try {
    const colaboradorId = req.userId;
    
    const pontos = await prisma.ponto.findMany({
      where: { colaboradorId },
      orderBy: { entrada: 'desc' }
    });

    return res.json(pontos);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar histórico' });
  }
};

// Solicitar correção de ponto
export const solicitarCorrecao = async (req: Request, res: Response) => {
  try {
    const colaboradorId = req.userId;
    const { pontoId, motivo, novaHora, tipo } = req.body;

    const tipoCorrecao = tipo || 'entrada';

    const solicitacao = await prisma.solicitacaoCorrecao.create({
      data: {
        colaboradorId,
        pontoId,
        motivo,
        novaHora: new Date(novaHora),
        tipo: tipoCorrecao,
      },
    });

    return res.status(201).json({ message: 'Solicitação enviada!', solicitacao });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao solicitar correção' });
  }
};

// Solicitar justificativa ou abono de falta
export const solicitarJustificativa = async (req: Request, res: Response) => {
  try {
    const colaboradorId = req.userId;
    const { dataFalta, motivo, anexoUrl } = req.body;

    // 1. Salva no banco de dados
    const justificativa = await prisma.justificativaAbono.create({
      data: {
        colaboradorId,
        dataFalta: new Date(dataFalta),
        motivo,
        anexoUrl: anexoUrl || null,
      },
    });

    return res.status(201).json({ message: 'Justificativa enviada!', justificativa });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao solicitar justificativa' });
  }
};