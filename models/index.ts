import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

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

const db: any = {};

// =====================
// INIT MODELS
// =====================
db.Product = require("./Product").default(sequelize);
db.Stock = require("./Stock").default(sequelize);
db.Sale = require("./Sale").default(sequelize);
db.SaleItem = require("./SaleItems").default(sequelize);
db.Brand = require("./Brand").default(sequelize);
db.Category = require("./Category").default(sequelize);
db.packaging = require("./Packaging").default(sequelize);

// =====================
// RELATIONSHIPS (FIXED)
// =====================

// Product → Stock
db.Product.hasOne(db.Stock, {
  foreignKey: "productId",
  as: "stock",
});

db.Stock.belongsTo(db.Product, {
  foreignKey: "productId",
  as: "product",
});

// Product → SaleItems
db.Product.hasMany(db.SaleItem, {
  foreignKey: "productId",
  as: "saleItems",
});

db.SaleItem.belongsTo(db.Product, {
  foreignKey: "productId",
  as: "product",
});

// Sale → SaleItems (IMPORTANT FIX)
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