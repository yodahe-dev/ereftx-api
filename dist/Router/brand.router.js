"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const brand_controllers_1 = require("../controllers/brand.controllers");
/**
 * =====================
 * WRAPPER
 * =====================
 */
const wrap = (fn) => (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
};
const router = (0, express_1.Router)();
/**
 * =====================
 * ROUTES
 * =====================
 */
// CREATE
router.post("/", wrap(brand_controllers_1.createBrand));
// GET ALL
router.get("/", wrap(brand_controllers_1.getBrands));
// UPDATE
router.put("/:id", wrap(brand_controllers_1.updateBrand));
// DELETE
router.delete("/:id", wrap(brand_controllers_1.deleteBrand));
exports.default = router;
