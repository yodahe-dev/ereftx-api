import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

/**
 * =====================
 * SEQUELIZE CONNECTION
 * =====================
 */
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

/**
 * =====================
 * IMPORT MODELS (SAFE IMPORTS)
 * =====================
 */
import initProduct from "./Product";
import initStock from "./Stock";
import initSale from "./Sale";
import initSaleItem from "./SaleItems";
import initBrand from "./Brand";
import initCategory from "./Category";
import initPackaging from "./Packaging";

/**
 * =====================
 * MODEL TYPES (STRICT DB SHAPE)
 * =====================
 */
export interface DB {
  [x: string]: any;
  sequelize: Sequelize;

  Product: ReturnType<typeof initProduct>;
  Stock: ReturnType<typeof initStock>;
  Sale: ReturnType<typeof initSale>;
  SaleItem: ReturnType<typeof initSaleItem>;
  Brand: ReturnType<typeof initBrand>;
  Category: ReturnType<typeof initCategory>;
  Packaging: ReturnType<typeof initPackaging>;
}

/**
 * =====================
 * INIT DB
 * =====================
 */
const db: DB = {
  sequelize,

  Product: initProduct(sequelize),
  Stock: initStock(sequelize),
  Sale: initSale(sequelize),
  SaleItem: initSaleItem(sequelize),
  Brand: initBrand(sequelize),
  Category: initCategory(sequelize),
  Packaging: initPackaging(sequelize),
};

/**
 * =====================
 * RELATIONSHIPS
 * =====================
 */

// Product → Stock (1:1)
db.Product.hasOne(db.Stock, {
  foreignKey: "productId",
  as: "stock",
});

db.Stock.belongsTo(db.Product, {
  foreignKey: "productId",
  as: "product",
});

// Product → SaleItems (1:N)
db.Product.hasMany(db.SaleItem, {
  foreignKey: "productId",
  as: "saleItems",
});

db.SaleItem.belongsTo(db.Product, {
  foreignKey: "productId",
  as: "product",
});

// Sale → SaleItems (1:N)
db.Sale.hasMany(db.SaleItem, {
  foreignKey: "saleId",
  as: "items",
});

db.SaleItem.belongsTo(db.Sale, {
  foreignKey: "saleId",
  as: "sale",
});

// =====================
// EXPORT
// =====================
export default db;