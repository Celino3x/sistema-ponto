import { Router } from 'express';
import { 
  registrarPonto, 
  solicitarCorrecao, 
  listarHistorico, 
  solicitarJustificativa,
  listarAdminColaboradores,
  listarAdminSolicitacoes,
  listarAdminJustificativas,
  aprovarAdminSolicitacao,
  gerarAdminRelatorio
} from '../controllers/pontoController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { isAdmin } from '../middlewares/authMiddleware';

const router = Router();

// ===== ROTAS DO COLABORADOR =====
router.post('/registrar', authMiddleware, registrarPonto);
router.post('/solicitar-correcao', authMiddleware, solicitarCorrecao);
router.post('/solicitar-justificativa', authMiddleware, solicitarJustificativa);
router.get('/historico', authMiddleware, listarHistorico);

// ===== ROTAS ADMIN =====
router.get('/admin/colaboradores', authMiddleware, isAdmin, listarAdminColaboradores);
router.get('/admin/solicitacoes', authMiddleware, isAdmin, listarAdminSolicitacoes);
router.get('/admin/justificativas', authMiddleware, isAdmin, listarAdminJustificativas);
router.put('/admin/solicitacoes/:id', authMiddleware, isAdmin, aprovarAdminSolicitacao);
router.get('/admin/relatorio', authMiddleware, isAdmin, gerarAdminRelatorio);

export default router;