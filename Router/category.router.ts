import { Router, Request, Response, NextFunction } from "express";

import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../modules/category/category.controllers";

/**
 * =====================
 * GENERIC ASYNC HANDLER
 * =====================
 */
type AsyncHandler<P = any, B = any> = (
  req: Request<P, any, B>,
  res: Response,
  next: NextFunction
) => Promise<Response | void>;

/**
 * =====================
 * WRAPPER (TYPE SAFE)
 * =====================
 */
const wrap =
  <P = any, B = any>(fn: AsyncHandler<P, B>) =>
  (req: Request<P, any, B>, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };

const router = Router();

/**
 * =====================
 * ROUTES
 * =====================
 */

// CREATE
router.post("/", wrap(createCategory));

// GET ALL
router.get("/", wrap(getCategories));

// GET BY ID (STRICT PARAM)
router.get("/:id", wrap(getCategoryById));

// UPDATE
router.put("/:id", wrap(updateCategory));

// DELETE
router.delete("/:id", wrap(deleteCategory));

export default router;