import { Router } from 'express';
import { 
  criarColaborador, 
  listarColaboradores, 
  listarSolicitacoes, 
  listarJustificativas,
  aprovarJustificativa,
  relatorioHoras, 
  aprovarSolicitacao, 
  aprovarTodas,
  atualizarColaborador,
  excluirColaborador
} from '../controllers/adminController';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware, isAdmin);

// Rotas de Colaboradores
router.post('/colaboradores', criarColaborador);
router.get('/colaboradores', listarColaboradores);
router.put('/colaboradores/:id', atualizarColaborador);
router.delete('/colaboradores/:id', excluirColaborador);

// Rotas de Relatórios
router.get('/relatorio', relatorioHoras);

// Rotas de Solicitações (Correção de Ponto)
router.get('/solicitacoes', listarSolicitacoes);
router.put('/solicitacoes/:id', aprovarSolicitacao);
router.put('/solicitacoes/aprovar-todas', aprovarTodas);

// Rotas de Justificativas (Abono de Falta)
router.get('/justificativas', listarJustificativas);
router.put('/justificativas/:id', aprovarJustificativa);

export default router;