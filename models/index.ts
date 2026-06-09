import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  (process.env.DB_PASS as string) || "",
  {
    host: process.env.DB_HOST as string,
    dialect: "mysql",
    logging: false,
    timezone: "+03:00",
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  }
);

// Import existing init functions
import initProduct from "./Product";
import initProductPrice from "./ProductPricing";
import initStock from "./Stock";
import initSale from "./Sale";
import initSaleItem from "./SaleItems";
import initBrand from "./Brand";
import initCategory from "./Category";
import initPackaging from "./Packaging";
import initExchange from "./Exchange";
import initStockHistory from "./StockHistory";

// Import Expense-related models
import initExpenseCategory from "./ExpenseCategory";
import initRecurringExpense from "./RecurringExpense";
import initExpensePlan from "./ExpensePlan";
import initExpense from "./Expense";
import initRecurringExpenseLastGenerated from "./RecurringExpenseLastGenerated";

// Import new trading journal models
import initTradingAccount from "./TradingAccount";
import initTradingSession from "./TradingSession";
import initTrade from "./Trade";
import initTradePlan from "./TradePlan";
import initRiskRule from "./RiskRule";
import initSessionSchedule from "./SessionSchedule";
import initSessionPerformance from "./SessionPerformance";
import initUserTradingSchedule from "./UserTradingSchedule";
import initSessionNotification from "./SessionNotification";
import initSessionStatistic from "./SessionStatistic";
import initHoliday from "./Holiday";

// Initialize existing models
const Product = initProduct(sequelize);
const ProductPrice = initProductPrice(sequelize);
const Stock = initStock(sequelize);
const Sale = initSale(sequelize);
const SaleItem = initSaleItem(sequelize);
const Brand = initBrand(sequelize);
const Category = initCategory(sequelize);
const Packaging = initPackaging(sequelize);
const Exchange = initExchange(sequelize);
const StockHistory = initStockHistory(sequelize);

// Initialize Expense models
const ExpenseCategory = initExpenseCategory(sequelize);
const RecurringExpense = initRecurringExpense(sequelize);
const ExpensePlan = initExpensePlan(sequelize);
const Expense = initExpense(sequelize);
const RecurringExpenseLastGenerated = initRecurringExpenseLastGenerated(sequelize);

// Initialize new trading models
const TradingAccount = initTradingAccount(sequelize);
const TradingSession = initTradingSession(sequelize);
const Trade = initTrade(sequelize);
const TradePlan = initTradePlan(sequelize);
const RiskRule = initRiskRule(sequelize);
const SessionSchedule = initSessionSchedule(sequelize);
const SessionPerformance = initSessionPerformance(sequelize);
const UserTradingSchedule = initUserTradingSchedule(sequelize);
const SessionNotification = initSessionNotification(sequelize);
const SessionStatistic = initSessionStatistic(sequelize);
const Holiday = initHoliday(sequelize);

export const models = {
  Product,
  ProductPrice,
  Stock,
  Sale,
  SaleItem,
  Brand,
  Category,
  Packaging,
  Exchange,
  StockHistory,
  ExpenseCategory,
  RecurringExpense,
  ExpensePlan,
  Expense,
  RecurringExpenseLastGenerated,
  TradingAccount,
  TradingSession,
  Trade,
  TradePlan,
  RiskRule,
  SessionSchedule,
  SessionPerformance,
  UserTradingSchedule,
  SessionNotification,
  SessionStatistic,
  Holiday,
};

export interface DB {
  sequelize: Sequelize;
  Product: typeof Product;
  ProductPrice: typeof ProductPrice;
  Stock: typeof Stock;
  Sale: typeof Sale;
  SaleItem: typeof SaleItem;
  Brand: typeof Brand;
  Category: typeof Category;
  Packaging: typeof Packaging;
  Exchange: typeof Exchange;
  StockHistory: typeof StockHistory;
  ExpenseCategory: typeof ExpenseCategory;
  RecurringExpense: typeof RecurringExpense;
  ExpensePlan: typeof ExpensePlan;
  Expense: typeof Expense;
  RecurringExpenseLastGenerated: typeof RecurringExpenseLastGenerated;
  TradingAccount: typeof TradingAccount;
  TradingSession: typeof TradingSession;
  Trade: typeof Trade;
  TradePlan: typeof TradePlan;
  RiskRule: typeof RiskRule;
  SessionSchedule: typeof SessionSchedule;
  SessionPerformance: typeof SessionPerformance;
  UserTradingSchedule: typeof UserTradingSchedule;
  SessionNotification: typeof SessionNotification;
  SessionStatistic: typeof SessionStatistic;
  Holiday: typeof Holiday;
}

const db: DB = {
  sequelize,
  ...models,
};

// ==================== EXISTING ASSOCIATIONS ====================
db.Brand.belongsTo(db.Category, { foreignKey: "categoryId", as: "category", onDelete: "RESTRICT" });
db.Category.hasMany(db.Brand, { foreignKey: "categoryId", as: "brands" });

db.Product.belongsTo(db.Brand, { foreignKey: "brandId", as: "brand", onDelete: "RESTRICT" });
db.Brand.hasMany(db.Product, { foreignKey: "brandId", as: "products" });

db.Product.belongsTo(db.Packaging, { foreignKey: "packagingId", as: "packaging", onDelete: "RESTRICT" });
db.Packaging.hasMany(db.Product, { foreignKey: "packagingId", as: "products" });

db.Product.hasMany(db.ProductPrice, { foreignKey: "productId", as: "prices", onDelete: "CASCADE" });
db.ProductPrice.belongsTo(db.Product, { foreignKey: "productId", as: "product" });

db.Product.hasOne(db.Stock, { foreignKey: "productId", as: "stock", onDelete: "CASCADE" });
db.Stock.belongsTo(db.Product, { foreignKey: "productId", as: "product" });

db.Sale.hasMany(db.SaleItem, { foreignKey: "saleId", as: "items", onDelete: "CASCADE" });
db.SaleItem.belongsTo(db.Sale, { foreignKey: "saleId", as: "sale" });

db.SaleItem.belongsTo(db.Product, { foreignKey: "productId", as: "product" });
db.Product.hasMany(db.SaleItem, { foreignKey: "productId", as: "sales" });

db.SaleItem.belongsTo(db.ProductPrice, { foreignKey: "priceId", as: "priceVersion" });

db.Product.hasMany(db.StockHistory, { foreignKey: "productId", as: "stockHistory" });
db.StockHistory.belongsTo(db.Product, { foreignKey: "productId", as: "product" });

db.StockHistory.belongsTo(db.Sale, { foreignKey: "saleId", as: "sale" });
db.StockHistory.belongsTo(db.ProductPrice, { foreignKey: "priceId", as: "price" });

db.Exchange.belongsTo(db.Product, { foreignKey: "sourceProductId", as: "sourceProduct" });
db.Exchange.belongsTo(db.Product, { foreignKey: "targetProductId", as: "targetProduct" });
db.Exchange.belongsTo(db.ProductPrice, { foreignKey: "sourcePriceId", as: "sourcePrice" });
db.Exchange.belongsTo(db.ProductPrice, { foreignKey: "targetPriceId", as: "targetPrice" });

db.ExpenseCategory.belongsTo(db.ExpenseCategory, { foreignKey: "parentId", as: "parentCategory", onDelete: "SET NULL" });
db.ExpenseCategory.hasMany(db.ExpenseCategory, { foreignKey: "parentId", as: "subCategories" });
db.ExpenseCategory.hasMany(db.Expense, { foreignKey: "categoryId", as: "expenses" });
db.Expense.belongsTo(db.ExpenseCategory, { foreignKey: "categoryId", as: "category" });
db.ExpenseCategory.hasMany(db.RecurringExpense, { foreignKey: "categoryId", as: "recurringTemplates" });
db.RecurringExpense.belongsTo(db.ExpenseCategory, { foreignKey: "categoryId", as: "category" });
db.RecurringExpense.hasMany(db.Expense, { foreignKey: "recurringExpenseId", as: "realizedExpenses" });
db.Expense.belongsTo(db.RecurringExpense, { foreignKey: "recurringExpenseId", as: "recurringTemplate" });
db.ExpensePlan.hasMany(db.Expense, { foreignKey: "expensePlanId", as: "expenses" });
db.Expense.belongsTo(db.ExpensePlan, { foreignKey: "expensePlanId", as: "plan" });
db.Product.hasMany(db.Expense, { foreignKey: "productId", as: "overheadExpenses" });
db.Expense.belongsTo(db.Product, { foreignKey: "productId", as: "product" });

db.RecurringExpense.hasOne(db.RecurringExpenseLastGenerated, { foreignKey: "recurringExpenseId", as: "lastGenerated" });
db.RecurringExpenseLastGenerated.belongsTo(db.RecurringExpense, { foreignKey: "recurringExpenseId", as: "recurringExpense" });

// ==================== NEW TRADING JOURNAL ASSOCIATIONS ====================

// Account -> Trades
db.TradingAccount.hasMany(db.Trade, { foreignKey: "accountId", as: "trades", onDelete: "CASCADE" });
db.Trade.belongsTo(db.TradingAccount, { foreignKey: "accountId", as: "account" });

// Account -> TradePlans
db.TradingAccount.hasMany(db.TradePlan, { foreignKey: "accountId", as: "plans", onDelete: "CASCADE" });
db.TradePlan.belongsTo(db.TradingAccount, { foreignKey: "accountId", as: "account" });

// Account -> RiskRules
db.TradingAccount.hasMany(db.RiskRule, { foreignKey: "accountId", as: "riskRules", onDelete: "CASCADE" });
db.RiskRule.belongsTo(db.TradingAccount, { foreignKey: "accountId", as: "account" });

// Account -> SessionStatistics
db.TradingAccount.hasMany(db.SessionStatistic, { foreignKey: "accountId", as: "sessionStats", onDelete: "CASCADE" });
db.SessionStatistic.belongsTo(db.TradingAccount, { foreignKey: "accountId", as: "account" });

// Trade <-> TradingSession (open)
db.Trade.belongsTo(db.TradingSession, { foreignKey: "openSessionId", as: "openSession" });
db.TradingSession.hasMany(db.Trade, { foreignKey: "openSessionId", as: "tradesOpened" });

// Trade <-> TradingSession (close)
db.Trade.belongsTo(db.TradingSession, { foreignKey: "closeSessionId", as: "closeSession" });
db.TradingSession.hasMany(db.Trade, { foreignKey: "closeSessionId", as: "tradesClosed" });

// Trade <-> TradingSession (overlaps)
db.Trade.belongsTo(db.TradingSession, { foreignKey: "openOverlapId", as: "openOverlap" });
db.Trade.belongsTo(db.TradingSession, { foreignKey: "closeOverlapId", as: "closeOverlap" });

// Trade <-> TradePlan (planned entry)
db.Trade.belongsTo(db.TradePlan, { foreignKey: "plannedEntryId", as: "plannedEntry" });
db.TradePlan.hasOne(db.Trade, { foreignKey: "plannedEntryId", as: "executedTrade" });

// SessionSchedule <-> TradingSession
db.TradingSession.hasMany(db.SessionSchedule, { foreignKey: "sessionId", as: "customSchedules", onDelete: "CASCADE" });
db.SessionSchedule.belongsTo(db.TradingSession, { foreignKey: "sessionId", as: "session" });

// SessionPerformance <-> TradingSession
db.TradingSession.hasMany(db.SessionPerformance, { foreignKey: "sessionId", as: "performanceRecords", onDelete: "CASCADE" });
db.SessionPerformance.belongsTo(db.TradingSession, { foreignKey: "sessionId", as: "session" });

// UserTradingSchedule <-> TradingSession (optional)
db.UserTradingSchedule.belongsTo(db.TradingSession, { foreignKey: "sessionId", as: "session" });
db.TradingSession.hasMany(db.UserTradingSchedule, { foreignKey: "sessionId", as: "userSchedules" });

// SessionNotification <-> TradingSession
db.SessionNotification.belongsTo(db.TradingSession, { foreignKey: "sessionId", as: "session" });
db.TradingSession.hasMany(db.SessionNotification, { foreignKey: "sessionId", as: "notifications" });

export default db;