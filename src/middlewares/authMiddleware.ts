import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: number;
  role: string;
}

// Verifica se o usuário está logado
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authorization.replace('Bearer', '').trim();

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET as string);
    const { id, role } = data as TokenPayload;

    req.userId = id;
    req.userRole = role;

    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Verifica se o usuário logado é ADMIN
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado: Apenas administradores' });
  }
  return next();
}