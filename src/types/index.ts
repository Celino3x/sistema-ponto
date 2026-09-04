// Tipos baseados no schema.prisma
export interface Colaborador {
  id: number;
  nome: string;
  matricula: string;
  endereco: string;
  usuario: string;
  senha: string; // Nunca retorne isso no frontend!
  role: 'ADMIN' | 'COLABORADOR';
  criadoEm: Date;
}

export interface PontoRegistro {
  id: number;
  colaboradorId: number;
  entrada: Date;
  saida: Date | null;
  horasTrabalhadas: number | null;
}

export interface SolicitacaoCorrecao {
  id: number;
  colaboradorId: number;
  pontoId: number | null;
  motivo: string;
  novaHora: Date;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  criadoEm: Date;
}

// Extensão do Express para o Middleware
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId: number;
      userRole: string;
    }
  }
}

export {};