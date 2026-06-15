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

import expanceRouter from "./Router/expense.router";
import recurringExpenseRouter from "./Router/recurringExpense.router";
import expensePlanRouter from "./Router/expensePlan.router";
import expenseCategoryRouter from "./Router/expenseCategory.router";
import priceHistoryRoutes from "./Router/priceHistory.routes";

import stockAnalyticsRouter from "./analytics/stockAnalytics/routes/stockAnalytics.router";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 2100;

/**
 * =====================
 * MIDDLEWARE
 * =====================
 */
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://100.91.219.27:3000",
        "http://100.91.219.27:3001" 
      ];
      if (process.env.CORS_ORIGIN) {
        const envOrigins = process.env.CORS_ORIGIN.split(",");
        envOrigins.forEach((url) => {
          const trimmedUrl = url.trim();
          if (trimmedUrl && !allowedOrigins.includes(trimmedUrl)) {
            allowedOrigins.push(trimmedUrl);
          }
        });
      }
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
app.use("/api/expenses", expanceRouter);
app.use("/api/expense-plans", expensePlanRouter);
app.use("/api/recurring-expenses", recurringExpenseRouter);
app.use("/api/expense-categories", expenseCategoryRouter);
app.use("/api/price-history", priceHistoryRoutes);
app.use("/api/analytics/stock", stockAnalyticsRouter);

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
