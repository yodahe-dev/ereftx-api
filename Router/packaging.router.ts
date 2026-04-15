import { Router } from "express";
import {
  createPackaging,
  getPackagings,
  updatePackaging,
  deletePackaging,
} from "../controllers/Packaging.controllers";

const router = Router();

// create
router.post("/", createPackaging);

// get all
router.get("/", getPackagings);

// update
router.put("/:id", updatePackaging);

// delete
router.delete("/:id", deletePackaging);

export default router;