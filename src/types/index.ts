export interface PontoRegistro {
  id: string;
  colaborador: string;
  dataHora: Date;
  latitude: number;
  longitude: number;
  tipo: 'entrada' | 'saida';
  status: 'normal' | 'pendente' | 'abonado';
  justificativa?: string;
  aprovadoPor?: string;
}

export interface Colaborador {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  gestor: boolean;
}