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

// ===================== LISTAR JUSTIFICATIVAS PENDENTES (COM ALERTA DE 15 DIAS) =====================
export const listarJustificativas = async (req: Request, res: Response) => {
  try {
    const justificativas = await prisma.justificativaAbono.findMany({
      where: { status: 'PENDENTE' },
      include: { colaborador: true },
    });

    // Adiciona um campo de alerta para cada justificativa
    const justificativasComAlerta = justificativas.map((just) => {
      const diasAfastamento = Math.ceil((new Date(just.dataFalta).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const alerta15Dias = diasAfastamento > 15;
      return { ...just, alerta15Dias };
    });

    return res.json(justificativasComAlerta);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar justificativas' });
  }
};

// ===================== APROVAR / REJEITAR JUSTIFICATIVA (COM ABONO AUTOMÁTICO) =====================
export const aprovarJustificativa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "APROVADO" ou "REJEITADO"

    const justificativa = await prisma.justificativaAbono.update({
      where: { id: Number(id) },
      data: { status },
    });

    // ===================== LÓGICA DE ABONO AUTOMÁTICO =====================
    if (status === 'APROVADO') {
      // 1. Define os horários padrão de expediente (08:00 às 18:00)
      const dataFalta = justificativa.dataFalta;
      const horaEntrada = new Date(dataFalta);
      horaEntrada.setHours(8, 0, 0, 0); // 08:00

      const horaSaida = new Date(dataFalta);
      horaSaida.setHours(18, 0, 0, 0); // 18:00

      const horasTrabalhadas = 10; // 10 horas de expediente

      // 2. Cria um registro de ponto com status "ABONADO"
      await prisma.ponto.create({
        data: {
          colaboradorId: justificativa.colaboradorId,
          entrada: horaEntrada,
          saida: horaSaida,
          horasTrabalhadas: horasTrabalhadas,
          status: 'ABONADO', // Você precisa adicionar esse campo no schema!
        },
      });
    }

    return res.json(justificativa);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao aprovar justificativa' });
  }
};

// ===================== APROVAR EM LOTE (JUSTIFICATIVAS) =====================
export const aprovarTodasJustificativas = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const justificativas = await prisma.justificativaAbono.findMany({
      where: { status: 'PENDENTE' },
    });

    for (const just of justificativas) {
      await prisma.justificativaAbono.update({
        where: { id: just.id },
        data: { status },
      });

      if (status === 'APROVADO') {
        const dataFalta = just.dataFalta;
        const horaEntrada = new Date(dataFalta);
        horaEntrada.setHours(8, 0, 0, 0);
        const horaSaida = new Date(dataFalta);
        horaSaida.setHours(18, 0, 0, 0);

        await prisma.ponto.create({
          data: {
            colaboradorId: just.colaboradorId,
            entrada: horaEntrada,
            saida: horaSaida,
            horasTrabalhadas: 10,
            status: 'ABONADO',
          },
        });
      }
    }

    return res.json({ message: `${justificativas.length} justificativas ${status.toLowerCase()}!` });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao aprovar em lote' });
  }
};

// ===================== RELATÓRIO =====================
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

// ===================== EXCLUIR COLABORADOR =====================
export const excluirColaborador = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const colaboradorId = Number(id);

    await prisma.ponto.deleteMany({
      where: { colaboradorId },
    });

    await prisma.justificativaAbono.deleteMany({
      where: { colaboradorId },
    });

    await prisma.solicitacaoCorrecao.deleteMany({
      where: { colaboradorId },
    });

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

// ===================== APROVAR EM LOTE (SOLICITAÇÕES) =====================
export const aprovarTodas = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
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