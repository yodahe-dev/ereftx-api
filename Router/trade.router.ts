// routers/trade.router.ts
import { Router } from 'express';
import { TradeController } from '../controllers/trade.controller';

const router = Router();

router.post('/', TradeController.create);
router.get('/', TradeController.list);
router.post('/search', TradeController.search);
router.post('/advanced-search', TradeController.advancedSearch);
router.get('/autocomplete/symbol', TradeController.autoCompleteSymbol);
router.get('/:id', TradeController.get);
router.put('/:id', TradeController.update);
router.delete('/:id', TradeController.delete);

export default router;