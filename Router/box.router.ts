import { Router } from "express";
import boxController from "../modules/Box/box.controllers";

const router = Router();

// CRUD
router.post("/", boxController.create);
router.get("/", boxController.getAll);
router.get("/:id", boxController.getById);
router.put("/:id", boxController.update);
router.delete("/:id", boxController.delete);

// Inventory management
router.patch("/bulk-inventory", boxController.bulkUpdateInventory);
router.post("/:id/restock", boxController.restock);
router.get("/low-stock/low", boxController.getLowStock);
router.get("/summary/summary", boxController.getInventorySummary);
router.get("/by-category/:categoryId", boxController.getByCategory);

export default router;