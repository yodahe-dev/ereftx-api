import { Router } from "express";
import boxTransactionsController from "../modules/BoxTransactions/boxTransactions.controllers";

const router = Router();

// Main transaction CRUD
router.post("/", boxTransactionsController.create);
router.get("/", boxTransactionsController.getAll);
router.get("/:id", boxTransactionsController.getById);
router.put("/:id", boxTransactionsController.update);
router.delete("/:id", boxTransactionsController.delete);

// Item management
router.post("/:id/items", boxTransactionsController.addItem);
router.put("/:id/items/:itemId", boxTransactionsController.updateItem);
router.delete("/:id/items/:itemId", boxTransactionsController.deleteItem);

export default router;