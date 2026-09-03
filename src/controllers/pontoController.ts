import { Request, Response } from 'express';
import { PontoRegistro } from '../types';

let registros: PontoRegistro[] = [];
let idCounter = 1;

export const registrarPonto = (req: Request, res: Response) => {
  const { colaborador, latitude, longitude, tipo } = req.body;

  if (!colaborador || !latitude || !longitude || !tipo) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
  }

  const novoRegistro: PontoRegistro = {
    id: String(idCounter++),
    colaborador,
    dataHora: new Date(),
    latitude,
    longitude,
    tipo,
    status: 'normal'
  };

  registros.push(novoRegistro);

  return res.status(201).json({
    mensagem: '✅ Ponto registrado com sucesso!',
    registro: novoRegistro
  });
};

export const listarHistorico = (req: Request, res: Response) => {
  const { colaboradorId } = req.params;
  
  const historico = registros.filter(r => r.colaborador === colaboradorId);
  
  return res.json({
    colaborador: colaboradorId,
    total: historico.length,
    registros: historico
  });
};

export const corrigirPonto = (req: Request, res: Response) => {
  const { id } = req.params;
  const { justificativa, status, aprovadoPor } = req.body;

  const registro = registros.find(r => r.id === id);
  
  if (!registro) {
    return res.status(404).json({ erro: 'Registro não encontrado' });
  }

  if (justificativa) registro.justificativa = justificativa;
  if (status) registro.status = status;
  if (aprovadoPor) registro.aprovadoPor = aprovadoPor;

  return res.json({
    mensagem: '✅ Registro corrigido com sucesso!',
    registro
  });
};