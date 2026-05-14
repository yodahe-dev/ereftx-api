import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./models";
import PackagingRouter from "./Router/packaging.router";
import CategoryRouter from "./Router/category.router";
import BrandRouter from "./Router/brand.router";
import ProductRouter from "./Router/product.router";
import stcokRouter from "./Router/stock.router";
import Sales from "./Router/sale.routes";
import boxTransactionsRouter from "./Router/boxTransactions.router";
import boxRouter from "./Router/box.router";


dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 9000;

/**
 * =====================
 * MIDDLEWARE
 * =====================
 */
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(",") 
        : ["http://localhost:3000"];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

/**
 * =====================
 * ROUTES
 * =====================
 */

app.use("/api/categories", CategoryRouter);
app.use("/api/brands", BrandRouter);
app.use("/api/packagings", PackagingRouter);
app.use("/api/products", ProductRouter);
app.use("/api/stocks", stcokRouter);
app.use("/api/sales", Sales);
app.use("/api/box-transactions", boxTransactionsRouter);
app.use("/api/boxes", boxRouter);

/**
 * HEALTH CHECK
 */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).send("EREFTX API running...");
});

/**
 * =====================
 * START SERVER
 * =====================
 */
(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("DB connected");

    await db.sequelize.sync({
      alter: false,
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("DB error:", err);
    process.exit(1);
  }
})();
