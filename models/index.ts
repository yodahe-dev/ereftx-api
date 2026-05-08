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
import initBox from "./Box";
import initBoxBoxTransactions from "./BoxTransactions";
import initBoxTransactionsItems from "./BoxTransactionItems";


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
  Box,
  BoxTransactions,
  BoxTransactionItems,
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
}

const db: DB = {
  sequelize,
  ...models,
};

db.Brand.belongsTo(db.Category, { 
  foreignKey: "categoryId", 
  as: "category",
  onDelete: "RESTRICT" 
});
db.Category.hasMany(db.Brand, { 
  foreignKey: "categoryId", 
  as: "brands" 
});

db.Product.belongsTo(db.Brand, { 
  foreignKey: "brandId", 
  as: "brand",
  onDelete: "RESTRICT" 
});
db.Brand.hasMany(db.Product, { 
  foreignKey: "brandId", 
  as: "products" 
});

db.Product.belongsTo(db.Packaging, { 
  foreignKey: "packagingId", 
  as: "packaging",
  onDelete: "RESTRICT" 
});
db.Packaging.hasMany(db.Product, { 
  foreignKey: "packagingId", 
  as: "products" 
});

/**
 * PRICING & STOCK
 */
db.Product.hasMany(db.ProductPrice, { 
  foreignKey: "productId", 
  as: "prices", 
  onDelete: "CASCADE" 
});
db.ProductPrice.belongsTo(db.Product, { 
  foreignKey: "productId", 
  as: "product" 
});

db.Product.hasOne(db.Stock, { 
  foreignKey: "productId", 
  as: "stock", 
  onDelete: "CASCADE" 
});
db.Stock.belongsTo(db.Product, { 
  foreignKey: "productId", 
  as: "product" 
});

db.Sale.hasMany(db.SaleItem, { 
  foreignKey: "saleId", 
  as: "items", 
  onDelete: "CASCADE" 
});
db.SaleItem.belongsTo(db.Sale, { 
  foreignKey: "saleId", 
  as: "sale" 
});

db.SaleItem.belongsTo(db.Product, { 
  foreignKey: "productId", 
  as: "product" 
});
db.Product.hasMany(db.SaleItem, { 
  foreignKey: "productId", 
  as: "sales" 
});

db.SaleItem.belongsTo(db.ProductPrice, { 
  foreignKey: "priceId", 
  as: "priceVersion" 
});

db.Product.hasMany(db.StockHistory, { 
  foreignKey: "productId", 
  as: "stockHistory" 
});
db.StockHistory.belongsTo(db.Product, { 
  foreignKey: "productId", 
  as: "product" 
});

db.StockHistory.belongsTo(db.Sale, { 
  foreignKey: "saleId", 
  as: "sale" 
});
db.StockHistory.belongsTo(db.ProductPrice, { 
  foreignKey: "priceId", 
  as: "price" 
});

db.Exchange.belongsTo(db.Product, { 
  foreignKey: "sourceProductId", 
  as: "sourceProduct" 
});
db.Exchange.belongsTo(db.Product, { 
  foreignKey: "targetProductId", 
  as: "targetProduct" 
});

db.Exchange.belongsTo(db.ProductPrice, { 
  foreignKey: "sourcePriceId", 
  as: "sourcePrice" 
});

db.Exchange.belongsTo(db.ProductPrice, { 
  foreignKey: "targetPriceId", 
  as: "targetPrice" 
});

db.Box.belongsTo(db.Category, {
  foreignKey: "categoryId",
  as: "category",
  onDelete: "RESTRICT",
});

db.Category.hasMany(db.Box, {
  foreignKey: "categoryId",
  as: "boxes",
});


db.BoxTransactionItems.belongsTo(db.BoxTransactions, {
  foreignKey: "boxTransactionId",
  as: "transaction",
  onDelete: "CASCADE",
});

db.BoxTransactions.hasMany(db.BoxTransactionItems, {
  foreignKey: "boxTransactionId",
  as: "items",
});


db.BoxTransactionItems.belongsTo(db.Box, {
  foreignKey: "boxId",
  as: "box",
  onDelete: "CASCADE",
});

db.Box.hasMany(db.BoxTransactionItems, {
  foreignKey: "boxId",
  as: "transactionItems",
});

export default db;