import { Router } from "express";
import { StockAnalyticsController } from "../controllers/stockAnalytics.controller";

const router = Router();
const controller = new StockAnalyticsController();

router.get("/restock-frequency", controller.getRestockFrequency.bind(controller));
router.get("/restock-quantity-details", controller.getRestockQuantityDetails.bind(controller));

export default router;