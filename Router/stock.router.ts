import { Router } from "express";
import {
  createStock,
  getStocks,
  getStockById,
  updateStock,
  deleteStock,
  exchangeProducts,
  getExchangeHistory,
  restockProduct,
  getStockHistory,
  updateStockHistory,
  deleteStockHistory,
  createProductPrice,
  updateProductPrice,
  deleteProductPrice,
} from "../modules/stocks/stock.controllers";
import {
  filterStocks,
  filterStockHistory,
} from "../modules/stocks/filtering/stockFilter.controllers";

const router = Router();

// ----- Stock CRUD -----
router.post("/", createStock);
router.get("/", getStocks);

// ----- Advanced filters (keep before :id) -----
router.get("/filter", filterStocks);
router.get("/history/filter", filterStockHistory);

// ----- Exchange -----
router.get("/history/exchanges", getExchangeHistory);
router.post("/exchange", exchangeProducts);

// ----- Restock -----
router.post("/:id/restock", restockProduct);

// ----- Stock History CRUD -----
router.get("/history/:productId", getStockHistory);   // get history by product
router.put("/history/:id", updateStockHistory);         // update a history record
router.delete("/history/:id", deleteStockHistory);      // delete a history record

// ----- Product Price CRUD -----
router.post("/price", createProductPrice);              // create new price (ends current active)
router.put("/price/:id", updateProductPrice);           // update a specific price record
router.delete("/price/:id", deleteProductPrice);        // delete a price record

// ----- Individual stock (must be after static routes) -----
router.get("/:id", getStockById);
router.put("/:id", updateStock);
router.delete("/:id", deleteStock);

export default router;