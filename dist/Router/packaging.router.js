"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const packaging_controllers_1 = require("../controllers/packaging.controllers");
const router = (0, express_1.Router)();
const wrap = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
router.post("/", wrap(packaging_controllers_1.createPackaging));
router.get("/", wrap(packaging_controllers_1.getPackagings));
router.put("/:id", wrap(packaging_controllers_1.updatePackaging));
exports.default = router;
