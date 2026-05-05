"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.models = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.sequelize = new sequelize_1.Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS || "", {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
    timezone: "+03:00", // Recommended for Ethiopia (EAT)
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});
// Import init functions
const Product_1 = __importDefault(require("./Product"));
const ProductPricing_1 = __importDefault(require("./ProductPricing"));
const Stock_1 = __importDefault(require("./Stock"));
const Sale_1 = __importDefault(require("./Sale"));
const SaleItems_1 = __importDefault(require("./SaleItems"));
const Brand_1 = __importDefault(require("./Brand"));
const Category_1 = __importDefault(require("./Category"));
const Packaging_1 = __importDefault(require("./Packaging"));
const Exchange_1 = __importDefault(require("./Exchange"));
const StockHistory_1 = __importDefault(require("./StockHistory"));
// Initialize models
const Product = (0, Product_1.default)(exports.sequelize);
const ProductPrice = (0, ProductPricing_1.default)(exports.sequelize);
const Stock = (0, Stock_1.default)(exports.sequelize);
const Sale = (0, Sale_1.default)(exports.sequelize);
const SaleItem = (0, SaleItems_1.default)(exports.sequelize);
const Brand = (0, Brand_1.default)(exports.sequelize);
const Category = (0, Category_1.default)(exports.sequelize);
const Packaging = (0, Packaging_1.default)(exports.sequelize);
const Exchange = (0, Exchange_1.default)(exports.sequelize);
const StockHistory = (0, StockHistory_1.default)(exports.sequelize);
// Type Export for use in other files
exports.models = {
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
const db = {
    sequelize: exports.sequelize,
    ...exports.models,
};
// ===== ASSOCIATIONS =====
/**
 * BRAND & CATEGORY HIERARCHY (The Change)
 * Now Brand belongs to Category, and Product only cares about Brand.
 */
db.Brand.belongsTo(db.Category, {
    foreignKey: "categoryId",
    as: "category",
    onDelete: "RESTRICT"
});
db.Category.hasMany(db.Brand, {
    foreignKey: "categoryId",
    as: "brands"
});
/**
 * PRODUCT CORE
 * Note: Removed Product.belongsTo(Category) because it's now redundant.
 */
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
/**
 * SALES & ITEMS
 */
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
// The Financial Link: Link SaleItem to the Price version used
db.SaleItem.belongsTo(db.ProductPrice, {
    foreignKey: "priceId",
    as: "priceVersion"
});
/**
 * HISTORY & AUDIT
 */
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
/**
 * EXCHANGES (Double-Product Relationship)
 */
db.Exchange.belongsTo(db.Product, {
    foreignKey: "sourceProductId",
    as: "sourceProduct"
});
db.Exchange.belongsTo(db.Product, {
    foreignKey: "targetProductId",
    as: "targetProduct"
});
// Financial link for Exchange
db.Exchange.belongsTo(db.ProductPrice, {
    foreignKey: "sourcePriceId",
    as: "sourcePrice"
});
db.Exchange.belongsTo(db.ProductPrice, {
    foreignKey: "targetPriceId",
    as: "targetPrice"
});
exports.default = db;
