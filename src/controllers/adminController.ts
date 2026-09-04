import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ===================== CRIAR COLABORADOR =====================
export const criarColaborador = async (req: Request, res: Response) => {
  try {
    const { nome, matricula, endereco, usuario, senha } = req.body;
    const senhaHash = await bcrypt.hash(senha, 10);

    const colaborador = await prisma.colaborador.create({
      data: {
        nome,
        matricula,
        endereco,
        usuario,
        senha: senhaHash,
        role: 'COLABORADOR',
      },
    });

    return res.status(201).json({ message: 'Colaborador criado!', colaborador });
  } catch (error) {
    return res.status(400).json({ error: 'Erro ao criar colaborador. Verifique se o usuário ou matrícula já existem.' });
  }
};

// ===================== LISTAR TODOS OS COLABORADORES =====================
export const listarColaboradores = async (req: Request, res: Response) => {
  try {
    const colaboradores = await prisma.colaborador.findMany({
      select: { id: true, nome: true, matricula: true },
    });
    return res.json(colaboradores);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar colaboradores' });
  }
};

// ===================== RELATÓRIO (INDIVIDUAL OU GERAL) =====================
export const relatorioHoras = async (req: Request, res: Response) => {
  try {
    const { colaboradorId, dataInicio, dataFim } = req.query;
    const colaboradorIdNum = colaboradorId ? Number(colaboradorId) : undefined;

    // Obter todos os pontos (individual ou de todos)
    const pontos = await prisma.ponto.findMany({
      where: {
        ...(colaboradorIdNum ? { colaboradorId: colaboradorIdNum } : {}),
        entrada: {
          gte: new Date(dataInicio as string || '2024-01-01'),
          lte: new Date(dataFim as string || '2030-12-31'),
        },
      },
      include: { colaborador: { select: { nome: true } } },
    });

    // Calcular horas totais
    const totalHoras = pontos.reduce((acc, ponto) => acc + (ponto.horasTrabalhadas || 0), 0);

    // Retornar os dados do relatório
    return res.json({ totalHoras, pontos });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

// ===================== APROVAR INDIVIDUAL =====================
export const aprovarSolicitacao = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const solicitacao = await prisma.solicitacaoCorrecao.update({
      where: { id: Number(id) },
      data: { status },
    });

    // Se aprovado, atualizar o ponto
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

// ===================== APROVAR EM LOTE (TODAS) =====================
export const aprovarTodas = async (req: Request, res: Response) => {
  try {
    const { status } = req.body; // "APROVADO" ou "REJEITADO"
    const solicitacoes = await prisma.solicitacaoCorrecao.findMany({
      where: { status: 'PENDENTE' },
    });

    // Atualizar status das solicitações
    for (const sol of solicitacoes) {
      await prisma.solicitacaoCorrecao.update({
        where: { id: sol.id },
        data: { status },
      });

      // Se aprovado, atualizar o ponto
      if (status === 'APROVADO') {
        await prisma.ponto.update({
          where: { id: sol.pontoId! },
          data: { entrada: sol.novaHora },
        });
      }
    }

    return res.json({ message: `${solicitacoes.length} solicitações ${status.toLowerCase()}!` });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao aprovar em lote' });
  }
};