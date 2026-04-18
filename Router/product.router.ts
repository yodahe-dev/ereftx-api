import { Router, Request, Response, NextFunction } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controllers";

/**
 * =====================
 * GENERIC ASYNC WRAPPER
 * =====================
 */
type AsyncHandler<P = any, B = any> = (
  req: Request<P, any, B>,
  res: Response,
  next: NextFunction
) => Promise<Response | void>;

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
router.post("/", wrap(createProduct));

// GET ALL
router.get("/", wrap(getProducts));

// GET BY ID
router.get("/:id", wrap(getProductById));

// UPDATE
router.put("/:id", wrap(updateProduct));

router.get("/test", (req, res) => {
  res.json({ ok: true });
});

// DELETE
router.delete("/:id", wrap(deleteProduct));

export default router;