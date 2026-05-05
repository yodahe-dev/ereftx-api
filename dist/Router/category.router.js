"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controllers_1 = require("../controllers/category.controllers");
/**
 * =====================
 * WRAPPER (TYPE SAFE)
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
router.post("/", wrap(category_controllers_1.createCategory));
// GET ALL
router.get("/", wrap(category_controllers_1.getCategories));
// GET BY ID (STRICT PARAM)
router.get("/:id", wrap(category_controllers_1.getCategoryById));
// UPDATE
router.put("/:id", wrap(category_controllers_1.updateCategory));
// DELETE
router.delete("/:id", wrap(category_controllers_1.deleteCategory));
exports.default = router;
