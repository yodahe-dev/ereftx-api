// models/index.ts
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
    timezone: "+03:00",               // Ethiopia time
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// ---------- Existing model imports ----------
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
import initBox from "./Box";
import initBoxBoxTransactions from "./BoxTransactions";
import initBoxTransactionsItems from "./BoxTransactionItems";

// ---------- NEW model imports ----------
import initBankAccount from "./BankAccount";
import initCustomer from "./Customer";
import initCredit from "./Credit";
import initExpense from "./Expense";
import initIncome from "./Income";
import initLoan from "./Loan";
import initCustomerDeposit from "./CustomerDeposit";
import initSavingsGoal from "./SavingsGoal";
import initBankTransaction from "./BankTransaction";      // <-- ADDED

// ---------- Initialize ALL models ----------
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
const Box = initBox(sequelize);
const BoxTransactions = initBoxBoxTransactions(sequelize);
const BoxTransactionItems = initBoxTransactionsItems(sequelize);

// New models
const BankAccount = initBankAccount(sequelize);
const Customer = initCustomer(sequelize);
const Credit = initCredit(sequelize);
const Expense = initExpense(sequelize);
const Income = initIncome(sequelize);
const Loan = initLoan(sequelize);
const CustomerDeposit = initCustomerDeposit(sequelize);
const SavingsGoal = initSavingsGoal(sequelize);
const BankTransaction = initBankTransaction(sequelize);

// ---------- Export all ----------
export const models = {
  Product, ProductPrice, Stock, Sale, SaleItem, Brand, Category, Packaging,
  Exchange, StockHistory, Box, BoxTransactions, BoxTransactionItems,
  // new
  BankAccount, Customer, Credit, Expense, Income, Loan, CustomerDeposit, SavingsGoal,
  BankTransaction,   // <-- ADDED
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
  Box: typeof Box;
  BoxTransactions: typeof BoxTransactions;
  BoxTransactionItems: typeof BoxTransactionItems;
  // new
  BankAccount: typeof BankAccount;
  Customer: typeof Customer;
  Credit: typeof Credit;
  Expense: typeof Expense;
  Income: typeof Income;
  Loan: typeof Loan;
  CustomerDeposit: typeof CustomerDeposit;
  SavingsGoal: typeof SavingsGoal;
  BankTransaction: typeof BankTransaction;   // <-- ADDED
}

const db: DB = { sequelize, ...models } as any;

// ==================== EXISTING ASSOCIATIONS (unchanged) ====================
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

db.Box.belongsTo(db.Category, { foreignKey: "catagroryId", as: "category", onDelete: "CASCADE" });
db.Category.hasMany(db.Box, { foreignKey: "catagroryId", as: "boxes" });

db.BoxTransactionItems.belongsTo(db.BoxTransactions, { foreignKey: "boxTransactionId", as: "transaction", onDelete: "CASCADE" });
db.BoxTransactions.hasMany(db.BoxTransactionItems, { foreignKey: "boxTransactionId", as: "items" });

db.BoxTransactionItems.belongsTo(db.Box, { foreignKey: "boxId", as: "box", onDelete: "CASCADE" });
db.Box.hasMany(db.BoxTransactionItems, { foreignKey: "boxId", as: "transactionItems" });

// ==================== PREVIOUS NEW ASSOCIATIONS ====================
db.Customer.hasMany(db.Credit, { foreignKey: "customerId", as: "credits" });
db.Credit.belongsTo(db.Customer, { foreignKey: "customerId", as: "customer" });

db.Credit.belongsTo(db.Sale, { foreignKey: "saleId", as: "sale" });
db.Sale.hasMany(db.Credit, { foreignKey: "saleId", as: "credits" });

db.BankAccount.hasMany(db.Expense, { foreignKey: "bankAccountId", as: "expenses" });
db.Expense.belongsTo(db.BankAccount, { foreignKey: "bankAccountId", as: "account" });

db.BankAccount.hasMany(db.Income, { foreignKey: "bankAccountId", as: "incomes" });
db.Income.belongsTo(db.BankAccount, { foreignKey: "bankAccountId", as: "account" });

db.Income.belongsTo(db.Sale, { foreignKey: "referenceId", as: "sale", constraints: false });
db.Sale.hasMany(db.Income, { foreignKey: "referenceId", as: "incomes", constraints: false });

db.Loan.belongsTo(db.BankAccount, { foreignKey: "bankAccountId", as: "account" });
db.BankAccount.hasMany(db.Loan, { foreignKey: "bankAccountId", as: "loans" });

db.Loan.belongsTo(db.Customer, { foreignKey: "counterpartyId", as: "customer", constraints: false });
db.Customer.hasMany(db.Loan, { foreignKey: "counterpartyId", as: "loans", constraints: false });

db.CustomerDeposit.belongsTo(db.Customer, { foreignKey: "customerId", as: "customer" });
db.Customer.hasMany(db.CustomerDeposit, { foreignKey: "customerId", as: "deposits" });

db.CustomerDeposit.belongsTo(db.Sale, { foreignKey: "relatedSaleId", as: "sale" });
db.Sale.hasMany(db.CustomerDeposit, { foreignKey: "relatedSaleId", as: "deposits" });

// ==================== NEWEST ASSOCIATIONS ====================

// 1. Loan -> Expense (loan can fund an expense)
db.Loan.hasMany(db.Expense, { foreignKey: "loanId", as: "fundedExpenses" });
db.Expense.belongsTo(db.Loan, { foreignKey: "loanId", as: "loan" });

// 2. SavingsGoal -> BankAccount
db.SavingsGoal.belongsTo(db.BankAccount, { foreignKey: "bankAccountId", as: "account" });
db.BankAccount.hasMany(db.SavingsGoal, { foreignKey: "bankAccountId", as: "savingsGoals" });

// 3. BankTransaction -> BankAccount (NEW)
db.BankTransaction.belongsTo(db.BankAccount, { foreignKey: "bankAccountId", as: "account" });
db.BankAccount.hasMany(db.BankTransaction, { foreignKey: "bankAccountId", as: "transactions" });

export default db;