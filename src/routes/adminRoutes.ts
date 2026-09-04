import { Router } from 'express';
import { listarSolicitacoes, aprovarSolicitacao, relatorioHoras } from '../controllers/adminController';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware, isAdmin);

router.get('/solicitacoes', listarSolicitacoes);
router.put('/solicitacoes/:id', aprovarSolicitacao);
router.get('/relatorio', relatorioHoras);

export default router;