import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// =====================
// SEQUELIZE CONNECTION
// =====================
const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST!,
    dialect: "mysql",
    logging: false,
  }
);

// =====================
// DB OBJECT
// =====================
const db: any = {};

// =====================
// INIT MODELS (FIXED NAMING)
// =====================
db.Product = require("./Product").default(sequelize);
db.Stock = require("./Stock").default(sequelize);
db.Sale = require("./Sale").default(sequelize);
db.SaleItem = require("./SaleItems").default(sequelize);
db.Brand = require("./Brand").default(sequelize);
db.Category = require("./Category").default(sequelize);
db.Packaging = require("./Packaging").default(sequelize);

// =====================
// RELATIONSHIPS
// =====================

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
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;