import { Router } from 'express';
import { TradingAccountController } from '../controllers/tradingAccount.controller';

const router = Router();

// CRUD
router.post('/', TradingAccountController.create);
router.get('/', TradingAccountController.list);
router.get('/autocomplete/name', TradingAccountController.autoCompleteName);
router.get('/:id', TradingAccountController.get);
router.put('/:id', TradingAccountController.update);
router.delete('/:id', TradingAccountController.delete);

// Analytics
router.get('/:accountId/equity', TradingAccountController.getEquityCurve);
router.get('/:accountId/drawdown', TradingAccountController.getDrawdown);
router.get('/:accountId/sharpe', TradingAccountController.getSharpeRatio);
router.get('/:accountId/profitfactor', TradingAccountController.getProfitFactor);
router.get('/:accountId/maxdd', TradingAccountController.getMaxDrawdown);
router.get('/:accountId/winrate', TradingAccountController.getWinRate);
router.get('/ranking/performance', TradingAccountController.getAccountRanking);
router.get('/distribution/profit', TradingAccountController.getProfitDistribution);

export default router;