import { Router } from "express";
import {
  createBrand,
  getBrands,
  updateBrand,
  deleteBrand,
} from "../controllers/brand.controllers";

const router = Router();

// create
router.post("/", createBrand);

// get all
router.get("/", getBrands);

// update
router.put("/:id", updateBrand);

// delete
router.delete("/:id", deleteBrand);

export default router;