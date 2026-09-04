import { Router } from 'express';
import { registrarPonto, solicitarCorrecao, listarHistorico, solicitarJustificativa } from '../controllers/pontoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/registrar', authMiddleware, registrarPonto);
router.post('/solicitar-correcao', authMiddleware, solicitarCorrecao);
router.post('/solicitar-justificativa', authMiddleware, solicitarJustificativa); // NOVA ROTA
router.get('/historico', authMiddleware, listarHistorico);

export default router;