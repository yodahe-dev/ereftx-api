import { Router, Request, Response, NextFunction } from "express";
import {
  createPackaging,
  getPackagings,
  updatePackaging,
  deletePackaging,
} from "../controllers/packaging.controllers"; // CORRECTED IMPORT

const router = Router();

const wrap = <P, ResBody, ReqBody, ReqQuery>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => Promise<Response<ResBody> | void>
) => {
  return (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

router.post("/", wrap(createPackaging));
router.get("/", wrap(getPackagings));
router.put("/:id", wrap(updatePackaging));
router.delete("/:id", wrap(deletePackaging));

export default router;