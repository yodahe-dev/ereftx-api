import { Router } from "express";
import {
  createPrice,
  getPricesByProduct,
  updatePrice,
  deletePrice,
  activatePrice,
} from "../controllers/priceHistory.controller";

const router = Router();

router.post("/", createPrice);
router.get("/product/:productId", getPricesByProduct);
router.put("/:priceId", updatePrice);
router.delete("/:priceId", deletePrice);
router.patch("/:priceId/activate", activatePrice);

export default router;