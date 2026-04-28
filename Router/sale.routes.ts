import { Router } from "express";
import { createSale, getSaleById, getSales, updateSale } from "../controllers/sale.controller";

const router = Router();
router.get("/", getSales);
router.get("/:id", getSaleById);
router.post("/", createSale);
router.put("/:id", updateSale);       // <-- new
export default router;