import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ===================== CRIAR COLABORADOR =====================
export const criarColaborador = async (req: Request, res: Response) => {
  try {
    const { nome, matricula, endereco, usuario, senha, funcao, area } = req.body;
    const senhaHash = await bcrypt.hash(senha, 10);

    const colaborador = await prisma.colaborador.create({
      data: {
        nome,
        matricula,
        endereco,
        usuario,
        senha: senhaHash,
        role: 'COLABORADOR',
        funcao,
        area,
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
      select: { id: true, nome: true, matricula: true, funcao: true, area: true, usuario: true },
    });
    return res.json(colaboradores);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar colaboradores' });
  }
};

// ===================== LISTAR SOLICITAÇÕES PENDENTES =====================
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

// ===================== RELATÓRIO (INDIVIDUAL OU GERAL) =====================
export const relatorioHoras = async (req: Request, res: Response) => {
  try {
    const { colaboradorId, dataInicio, dataFim } = req.query;
    const colaboradorIdNum = colaboradorId ? Number(colaboradorId) : undefined;

    const pontos = await prisma.ponto.findMany({
      where: {
        ...(colaboradorIdNum ? { colaboradorId: colaboradorIdNum } : {}),
        entrada: {
          gte: new Date(dataInicio as string || '2024-01-01'),
          lte: new Date(dataFim as string || '2030-12-31'),
        },
      },
      include: { colaborador: { select: { nome: true, matricula: true, funcao: true, area: true } } },
    });

    const totalHoras = pontos.reduce((acc, ponto) => acc + (ponto.horasTrabalhadas || 0), 0);

    return res.json({ totalHoras, pontos });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

// ===================== ATUALIZAR COLABORADOR =====================
export const atualizarColaborador = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, matricula, endereco, usuario, senha, funcao, area, role } = req.body;

    const dados: any = { nome, matricula, endereco, usuario, funcao, area, role };
    if (senha) {
      dados.senha = await bcrypt.hash(senha, 10);
    }

    const colaborador = await prisma.colaborador.update({
      where: { id: Number(id) },
      data: dados,
    });

    return res.json({ message: 'Colaborador atualizado!', colaborador });
  } catch (error) {
    return res.status(400).json({ error: 'Erro ao atualizar colaborador' });
  }
};

// ===================== EXCLUIR COLABORADOR (COM LIMPEZA) =====================
export const excluirColaborador = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const colaboradorId = Number(id);

    // 1. Exclui os pontos do colaborador
    await prisma.ponto.deleteMany({
      where: { colaboradorId },
    });

    // 2. Exclui as justificativas do colaborador
    await prisma.justificativaAbono.deleteMany({
      where: { colaboradorId },
    });

    // 3. Exclui as solicitações de correção do colaborador
    await prisma.solicitacaoCorrecao.deleteMany({
      where: { colaboradorId },
    });

    // 4. Agora sim, exclui o colaborador
    await prisma.colaborador.delete({
      where: { id: colaboradorId },
    });

    return res.json({ message: 'Colaborador excluído!' });
  } catch (error) {
    console.error('Erro ao excluir colaborador:', error);
    return res.status(500).json({ error: 'Erro ao excluir colaborador' });
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

    for (const sol of solicitacoes) {
      await prisma.solicitacaoCorrecao.update({
        where: { id: sol.id },
        data: { status },
      });

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