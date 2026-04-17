import { Router, Request, Response, NextFunction } from "express";
import {
  createPackaging,
  getPackagings,
  updatePackaging,
  deletePackaging,
} from "../controllers/packaging.controllers";

const router = Router();

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<Response | void>;

const wrap =
  (fn: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };

// create
router.post("/", wrap(createPackaging));

// get all
router.get("/", wrap(getPackagings));

// update
router.put("/:id", wrap(updatePackaging));

// delete
router.delete("/:id", wrap(deletePackaging));

export default router;