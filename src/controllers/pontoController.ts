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
// ===================== FUNÇÕES ADMIN =====================

// Listar todos os colaboradores
export const listarAdminColaboradores = async (req: Request, res: Response) => {
  try {
    const colaboradores = await prisma.colaborador.findMany({
      select: {
        id: true,
        nome: true,
        matricula: true,
        endereco: true,
        usuario: true,
        role: true,
        pontos: {
          orderBy: { entrada: 'desc' },
          take: 1
        }
      }
    });

    return res.json(colaboradores);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao listar colaboradores' });
  }
};

// Listar solicitações pendentes
export const listarAdminSolicitacoes = async (req: Request, res: Response) => {
  try {
    const solicitacoes = await prisma.solicitacaoCorrecao.findMany({
      where: { status: 'pendente' },
      include: {
        colaborador: true
      },
      orderBy: { id: 'asc' }
    });

    return res.json(solicitacoes);
  } catch (error) {
    console.error('Erro ao listar solicitações:', error);
    return res.status(500).json({ error: 'Erro ao listar solicitações' });
  }
};

// Listar justificativas pendentes
export const listarAdminJustificativas = async (req: Request, res: Response) => {
  try {
    const justificativas = await prisma.justificativaAbono.findMany({
      where: { status: 'pendente' },
      include: {
        colaborador: true
      },
      orderBy: { id: 'asc' }
    });

    return res.json(justificativas);
  } catch (error) {
    console.error('Erro ao listar justificativas:', error);
    return res.status(500).json({ error: 'Erro ao listar justificativas' });
  }
};

// Aprovar/rejeitar solicitação
export const aprovarAdminSolicitacao = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['APROVADO', 'REJEITADO'].includes(status)) {
      return res.status(400).json({ error: 'Status deve ser APROVADO ou REJEITADO' });
    }

    const solicitacao = await prisma.solicitacaoCorrecao.update({
      where: { id: Number(id) },
      data: {
        status: status === 'APROVADO' ? 'aprovado' : 'rejeitado'
      }
    });

    // Verifica se pontoId existe antes de usar
    if (status === 'APROVADO' && solicitacao.pontoId) {
      const ponto = await prisma.ponto.findUnique({
        where: { id: solicitacao.pontoId }
      });

      if (ponto) {
        if (solicitacao.tipo === 'entrada') {
          await prisma.ponto.update({
            where: { id: solicitacao.pontoId },
            data: { entrada: solicitacao.novaHora }
          });
        } else if (solicitacao.tipo === 'saida') {
          await prisma.ponto.update({
            where: { id: solicitacao.pontoId },
            data: { saida: solicitacao.novaHora }
          });
        }
      }
    }

    return res.json({ message: `✅ Solicitação ${status} com sucesso!` });
  } catch (error) {
    console.error(error);
    return res.status(404).json({ error: 'Solicitação não encontrada' });
  }
};

// Gerar relatório
export const gerarAdminRelatorio = async (req: Request, res: Response) => {
  try {
    const { colaboradorId, dataInicio, dataFim } = req.query;

    const where: any = {};
    if (colaboradorId) where.colaboradorId = Number(colaboradorId);
    if (dataInicio) where.entrada = { gte: new Date(dataInicio as string) };
    if (dataFim) where.saida = { lte: new Date(dataFim as string) };

    const pontos = await prisma.ponto.findMany({
      where,
      include: {
        colaborador: true
      },
      orderBy: { entrada: 'asc' }
    });

    const resultado: any = {};
    for (const p of pontos) {
      if (!resultado[p.colaboradorId]) {
        resultado[p.colaboradorId] = {
          colaborador: p.colaborador,
          horasTrabalhadas: 0,
          totalRegistros: 0
        };
      }
      if (p.horasTrabalhadas) {
        resultado[p.colaboradorId].horasTrabalhadas += p.horasTrabalhadas;
        resultado[p.colaboradorId].totalRegistros += 1;
      }
    }

    const finalResult = Object.values(resultado).map((item: any) => ({
      ...item,
      horasTrabalhadas: item.horasTrabalhadas || 0
    }));

    return res.json({
      totalHoras: finalResult.reduce((acc: number, cur: any) => acc + cur.horasTrabalhadas, 0),
      pontos: finalResult
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};