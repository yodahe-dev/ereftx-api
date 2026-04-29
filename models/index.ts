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
    timezone: "+03:00", // Recommended for Ethiopia (EAT)
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Import init functions
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

// Initialize models
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

// Type Export for use in other files
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
}

const db: DB = {
  sequelize,
  ...models
};

// ===== 100x ASSOCIATIONS =====

/**
 * PRODUCT CORE
 */
db.Product.belongsTo(db.Category, { foreignKey: "categoryId", as: "category" });
db.Category.hasMany(db.Product, { foreignKey: "categoryId", as: "products" });

db.Product.belongsTo(db.Brand, { foreignKey: "brandId", as: "brand" });
db.Brand.hasMany(db.Product, { foreignKey: "brandId", as: "products" });

db.Product.belongsTo(db.Packaging, { foreignKey: "packagingId", as: "packaging" });
db.Packaging.hasMany(db.Product, { foreignKey: "packagingId", as: "products" });

/**
 * PRICING & STOCK
 */
db.Product.hasMany(db.ProductPrice, { foreignKey: "productId", as: "prices", onDelete: "CASCADE" });
db.ProductPrice.belongsTo(db.Product, { foreignKey: "productId", as: "product" });

db.Product.hasOne(db.Stock, { foreignKey: "productId", as: "stock", onDelete: "CASCADE" });
db.Stock.belongsTo(db.Product, { foreignKey: "productId", as: "product" });

/**
 * SALES & ITEMS
 */
db.Sale.hasMany(db.SaleItem, { foreignKey: "saleId", as: "items", onDelete: "CASCADE" });
db.SaleItem.belongsTo(db.Sale, { foreignKey: "saleId", as: "sale" });

db.SaleItem.belongsTo(db.Product, { foreignKey: "productId", as: "product" });
db.Product.hasMany(db.SaleItem, { foreignKey: "productId", as: "sales" });

// The Financial Link: Link SaleItem to the Price version used
db.SaleItem.belongsTo(db.ProductPrice, { foreignKey: "priceId", as: "priceVersion" });

/**
 * HISTORY & AUDIT
 */
db.Product.hasMany(db.StockHistory, { foreignKey: "productId", as: "stockHistory" });
db.StockHistory.belongsTo(db.Product, { foreignKey: "productId", as: "product" });

db.StockHistory.belongsTo(db.Sale, { foreignKey: "saleId", as: "sale" });
db.StockHistory.belongsTo(db.ProductPrice, { foreignKey: "priceId", as: "price" });

/**
 * EXCHANGES (Double-Product Relationship)
 */
db.Exchange.belongsTo(db.Product, { foreignKey: "sourceProductId", as: "sourceProduct" });
db.Exchange.belongsTo(db.Product, { foreignKey: "targetProductId", as: "targetProduct" });

// Financial link for Exchange
db.Exchange.belongsTo(db.ProductPrice, { foreignKey: "sourcePriceId", as: "sourcePrice" });
db.Exchange.belongsTo(db.ProductPrice, { foreignKey: "targetPriceId", as: "targetPrice" });

export default db;