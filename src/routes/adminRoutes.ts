import { Router } from 'express';
import { 
  criarColaborador, 
  listarColaboradores, 
  listarSolicitacoes, 
  relatorioHoras, 
  aprovarSolicitacao, 
  aprovarTodas 
} from '../controllers/adminController';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware, isAdmin);

// Rotas de Colaboradores
router.post('/colaboradores', criarColaborador);
router.get('/colaboradores', listarColaboradores);

// Rotas de Relatórios
router.get('/relatorio', relatorioHoras);

// Rotas de Solicitações
router.get('/solicitacoes', listarSolicitacoes);
router.put('/solicitacoes/:id', aprovarSolicitacao);
router.put('/solicitacoes/aprovar-todas', aprovarTodas);

export default router;