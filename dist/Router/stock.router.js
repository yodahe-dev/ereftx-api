"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stock_controllers_1 = require("../controllers/stock.controllers");
const router = (0, express_1.Router)();
// Static routes first
router.post("/", stock_controllers_1.createStock);
router.get("/", stock_controllers_1.getStocks);
// History & analytics
router.get("/history/exchanges", stock_controllers_1.getExchangeHistory);
router.get("/history/:productId", stock_controllers_1.getStockHistory);
// Stock operations
router.post("/exchange", stock_controllers_1.exchangeProducts);
router.post("/:id/restock", stock_controllers_1.restockProduct); // <--- FIXED: mount at /:id/restock
// Individual resource (dynamic :id – must come after more specific paths)
router.get("/:id", stock_controllers_1.getStockById);
router.put("/:id", stock_controllers_1.updateStock);
router.delete("/:id", stock_controllers_1.deleteStock);
exports.default = router;
