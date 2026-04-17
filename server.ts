import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./models";

import CategoryRouter from "./Router/category.router";
import BrandRouter from "./Router/brand.router";
import PackagingRouter from "./Router/packaging.router";
import ProductRouter from "./Router/product.router";

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
    origin: "http://localhost:3000",
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
app.use("", PackagingRouter);
app.use("/api/products", ProductRouter);

app.get("/", (_req: Request, res: Response) => {
  res.status(200).send("EREFTX API running...");
});

/**
 * =====================
 * 404 HANDLER
 * =====================
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    message: "Route not found",
  });
});

/**
 * =====================
 * GLOBAL ERROR HANDLER
 * =====================
 */
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("GLOBAL ERROR:", err);

  return res.status(500).json({
    message: "Internal server error",
  });
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
      alter: false, // keep production safe
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("DB error:", err);
    process.exit(1);
  }
})();