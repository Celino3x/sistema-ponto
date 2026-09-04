import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===================== CADASTRAR (REGISTER) =====================
export const register = async (req: Request, res: Response) => {
  try {
    const { nome, matricula, endereco, usuario, senha } = req.body;

    // Verifica se usuário ou matrícula já existem
    const usuarioExistente = await prisma.colaborador.findUnique({ where: { usuario } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Usuário já cadastrado' });
    }

    // Criptografa a senha
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

    return res.status(201).json({ message: 'Colaborador criado com sucesso!' });
  } catch (error) {
    return res.status(400).json({ error: 'Erro ao cadastrar. Verifique os dados enviados.' });
  }
};

// ===================== LOGIN =====================
export const login = async (req: Request, res: Response) => {
  try {
    const { usuario, senha } = req.body;

    // 1. Verifica se o usuário existe
    const colaborador = await prisma.colaborador.findUnique({ where: { usuario } });

    if (!colaborador) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // 2. Verifica a senha
    const senhaValida = await bcrypt.compare(senha, colaborador.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // 3. Gera o token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('ERRO CRÍTICO: JWT_SECRET não encontrado!');
      return res.status(500).json({ error: 'Erro interno no login' });
    }

    const token = jwt.sign(
      { id: colaborador.id, role: colaborador.role },
      secret,
      { expiresIn: '8h' }
    );

    return res.json({ token, nome: colaborador.nome, role: colaborador.role, id: colaborador.id });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno no login' });
  }
};