import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./models";

// Existing routers
import PackagingRouter from "./Router/packaging.router";
import CategoryRouter from "./Router/category.router";
import BrandRouter from "./Router/brand.router";
import ProductRouter from "./Router/product.router";
import stockRouter from "./Router/stock.router";
import SalesRouter from "./Router/sale.routes";
import expenseRouter from "./Router/expense.router";
import recurringExpenseRouter from "./Router/recurringExpense.router";
import expensePlanRouter from "./Router/expensePlan.router";
import expenseCategoryRouter from "./Router/expenseCategory.router";

// New trading journal routers
import tradingAccountRouter from "./Router/tradingAccount.router";
import tradeRouter from "./Router/trade.router";
import tradePlanRouter from "./Router/tradePlan.router";
import sessionRouter from "./Router/session.router";
import tradingScheduleRouter from "./Router/tradingSchedule.router";
import tradingSessionRouter from "./Router/tradingSession.router";
import sessionScheduleRouter from "./Router/sessionSchedule.router";
import sessionPerformanceRouter from './Router/sessionPerformance.router';

// Services and jobs for session tracking
import { SessionService } from "./service/session.service";
import { initSessionTracker, startSessionTracker } from "./jobs/session.tracker";
import { setSessionService } from "./controllers/session.controller";
import { HourlyAggregator } from "./jobs/HourlyAggregator";
import { SessionPerformanceUpdater } from "./jobs/SessionPerformanceUpdater";
import { TradePlanExpirer } from "./jobs/TradePlan.expirer";

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
// Existing routes
app.use("/api/categories", CategoryRouter);
app.use("/api/brands", BrandRouter);
app.use("/api/packagings", PackagingRouter);
app.use("/api/products", ProductRouter);
app.use("/api/stocks", stockRouter);
app.use("/api/sales", SalesRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/expense-plans", expensePlanRouter);
app.use("/api/recurring-expenses", recurringExpenseRouter);
app.use("/api/expense-categories", expenseCategoryRouter);

// New trading journal routes
app.use("/api/accounts", tradingAccountRouter);
app.use("/api/trades", tradeRouter);
app.use("/api/trade-plans", tradePlanRouter);
app.use("/api/session", sessionRouter);
app.use("/api/schedules", tradingScheduleRouter);
app.use("/api/sessions", tradingSessionRouter);
app.use("/api/session-schedules", sessionScheduleRouter);
app.use('/api/session-performance', sessionPerformanceRouter);

/**
 * HEALTH CHECK
 */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).send("EREFTX API running...");
});

/**
 * =====================
 * START SERVER & BACKGROUND JOBS
 * =====================
 */
(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("DB connected");

    await db.sequelize.sync({ alter: false });
    console.log("Database models synced");

    // ==================== SEED DEFAULT DATA ====================
    // Check and insert default trading sessions if table is empty
    const sessionCount = await db.TradingSession.count();
    if (sessionCount === 0) {
      console.log("Seeding default trading sessions...");
      await db.TradingSession.bulkCreate([
        { name: 'Sydney', abbreviation: 'SYD', timezone: 'Australia/Sydney', localOpenHour: 7, localOpenMinute: 0, localCloseHour: 16, localCloseMinute: 0, priority: 1 },
        { name: 'Tokyo', abbreviation: 'TKY', timezone: 'Asia/Tokyo', localOpenHour: 9, localOpenMinute: 0, localCloseHour: 18, localCloseMinute: 0, priority: 2 },
        { name: 'London', abbreviation: 'LDN', timezone: 'Europe/London', localOpenHour: 8, localOpenMinute: 0, localCloseHour: 17, localCloseMinute: 0, priority: 3 },
        { name: 'NewYork', abbreviation: 'NY', timezone: 'America/New_York', localOpenHour: 9, localOpenMinute: 0, localCloseHour: 16, localCloseMinute: 0, priority: 4 },
      ]);
      console.log("Trading sessions seeded successfully.");
    }

    // Optional: seed holidays if needed (example)
    // const holidayCount = await db.Holiday?.count();
    // if (holidayCount === 0) { ... }

    // Initialize session service and background jobs
    const sessionService = new SessionService();
    setSessionService(sessionService);
    initSessionTracker(sessionService);
    
    // Start the background jobs
    startSessionTracker();               // updates current session every minute
    HourlyAggregator.start();            // precomputes hourly stats
    SessionPerformanceUpdater.start();   // refreshes session performance daily
    TradePlanExpirer.start();            // auto‑expires pending plans

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("DB error:", err);
    process.exit(1);
  }
})();