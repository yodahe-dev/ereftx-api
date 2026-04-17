import { Router, Request, Response, NextFunction } from "express";
import {
  createBrand,
  getBrands,
  updateBrand,
  deleteBrand,
} from "../controllers/brand.controllers";

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
 * WRAPPER
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
router.post("/", wrap(createBrand));

// GET ALL
router.get("/", wrap(getBrands));

// UPDATE
router.put("/:id", wrap(updateBrand));

// DELETE
router.delete("/:id", wrap(deleteBrand));

export default router;