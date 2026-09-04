import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // 3. Gera o token (AGORA COM A CHAVE SECRETA)
    // Se a chave estiver undefined, o jwt quebra!
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('ERRO CRÍTICO: JWT_SECRET não encontrado no .env ou na Vercel!');
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