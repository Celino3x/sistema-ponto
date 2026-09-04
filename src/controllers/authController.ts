import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { nome, matricula, endereco, usuario, senha } = req.body;

    const usuarioExistente = await prisma.colaborador.findUnique({ where: { usuario } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Usuário já cadastrado' });
    }

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

export const login = async (req: Request, res: Response) => {
  try {
    const { usuario, senha } = req.body;

    const colaborador = await prisma.colaborador.findUnique({ where: { usuario } });

    if (!colaborador) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const senhaValida = await bcrypt.compare(senha, colaborador.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: colaborador.id, role: colaborador.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    return res.json({ token, nome: colaborador.nome, role: colaborador.role, id: colaborador.id });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no login' });
  }
};