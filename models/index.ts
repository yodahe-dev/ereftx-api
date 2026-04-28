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

// Initialise models
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

// ===== ASSOCIATIONS =====

// Product ⇄ ProductPrice
db.Product.hasMany(db.ProductPrice, { foreignKey: "productId", as: "prices", onDelete: "CASCADE" });
db.ProductPrice.belongsTo(db.Product, { foreignKey: "productId", as: "product" });

// Product ⇄ Category / Brand / Packaging
db.Product.belongsTo(db.Category, { foreignKey: "categoryId", as: "category" });
db.Category.hasMany(db.Product, { foreignKey: "categoryId" });

db.Product.belongsTo(db.Brand, { foreignKey: "brandId", as: "brand" });
db.Brand.hasMany(db.Product, { foreignKey: "brandId" });

db.Product.belongsTo(db.Packaging, { foreignKey: "packagingId", as: "packaging" });
db.Packaging.hasMany(db.Product, { foreignKey: "packagingId" });

// Product ⇄ Stock (one-to-one)
db.Product.hasOne(db.Stock, { foreignKey: "productId", as: "stock", onDelete: "CASCADE" });
db.Stock.belongsTo(db.Product, { foreignKey: "productId", as: "product" });

// Product ⇄ SaleItem
db.Product.hasMany(db.SaleItem, { foreignKey: "productId", as: "saleItems" });
db.SaleItem.belongsTo(db.Product, { foreignKey: "productId", as: "product" });

// Sale ⇄ SaleItem
db.Sale.hasMany(db.SaleItem, { foreignKey: "saleId", as: "items" });
db.SaleItem.belongsTo(db.Sale, { foreignKey: "saleId", as: "sale" });

// Product ⇄ StockHistory
db.Product.hasMany(db.StockHistory, { foreignKey: "productId", as: "history", onDelete: "CASCADE" });
db.StockHistory.belongsTo(db.Product, { foreignKey: "productId", as: "product" });

// Sale ⇄ StockHistory
db.Sale.hasMany(db.StockHistory, { foreignKey: "saleId", as: "stockHistory" });
db.StockHistory.belongsTo(db.Sale, { foreignKey: "saleId", as: "sale" });

// Exchange ⇄ Product
db.Exchange.belongsTo(db.Product, { foreignKey: "sourceProductId", as: "sourceProduct" });
db.Exchange.belongsTo(db.Product, { foreignKey: "targetProductId", as: "targetProduct" });

export default db;