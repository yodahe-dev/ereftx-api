"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const models_1 = __importDefault(require("./models"));
const packaging_router_1 = __importDefault(require("./Router/packaging.router"));
const category_router_1 = __importDefault(require("./Router/category.router"));
const brand_router_1 = __importDefault(require("./Router/brand.router"));
const product_router_1 = __importDefault(require("./Router/product.router"));
const stock_router_1 = __importDefault(require("./Router/stock.router"));
const sale_routes_1 = __importDefault(require("./Router/sale.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 9000;
/**
 * =====================
 * MIDDLEWARE
 * =====================
 */
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(",")
            : ["http://localhost:3000"];
        // Check if the request origin is in the allowed list
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json());
/**
 * =====================
 * ROUTES
 * =====================
 */
app.use("/api/categories", category_router_1.default);
app.use("/api/brands", brand_router_1.default);
app.use("/api/packagings", packaging_router_1.default);
app.use("/api/products", product_router_1.default);
app.use("/api/stocks", stock_router_1.default);
app.use("/api/sales", sale_routes_1.default);
/**
 * HEALTH CHECK
 */
app.get("/", (_req, res) => {
    res.status(200).send("EREFTX API running...");
});
/**
 * =====================
 * START SERVER
 * =====================
 */
(async () => {
    try {
        await models_1.default.sequelize.authenticate();
        console.log("DB connected");
        await models_1.default.sequelize.sync({
            alter: false,
        });
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error("DB error:", err);
        process.exit(1);
    }
})();
