import { Router } from 'express';
import { registrarPonto, listarHistorico, corrigirPonto } from '../controllers/pontoController';

const router = Router();

router.post('/registrar', registrarPonto);
router.get('/historico/:colaboradorId', listarHistorico);
router.put('/corrigir/:id', corrigirPonto);

export default router;