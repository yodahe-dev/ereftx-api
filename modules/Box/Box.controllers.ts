import { Request, Response } from "express";
import boxService from "./service/box.service";
import {
  CreateBoxSchema,
  UpdateBoxSchema,
  BulkUpdateInventorySchema,
  BoxQuerySchema,
} from "./validations/box.schema";

export class BoxController {
  async create(req: Request, res: Response) {
    const validatedData = CreateBoxSchema.parse(req.body);
    const result = await boxService.createBox(validatedData);
    res.status(201).json({ success: true, data: result });
  }

  async getAll(req: Request, res: Response) {
    const validatedQuery = BoxQuerySchema.parse(req.query);
    const result = await boxService.getAllBoxes(validatedQuery);
    res.status(200).json({ success: true, ...result });
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await boxService.getBoxById(id as string);
    res.status(200).json({ success: true, data: result });
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const validatedData = UpdateBoxSchema.parse(req.body);
    const result = await boxService.updateBox(id as string, validatedData);
    res.status(200).json({ success: true, data: result });
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const result = await boxService.deleteBox(id as string);
    res.status(200).json(result);
  }

  async bulkUpdateInventory(req: Request, res: Response) {
    const validatedData = BulkUpdateInventorySchema.parse(req.body);
    await boxService.bulkUpdateInventory(validatedData);
    res.status(200).json({ success: true, message: "Inventory updated successfully" });
  }

  async restock(req: Request, res: Response) {
    const { id } = req.params;
    const { quantity } = req.body;
    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      res.status(400).json({ success: false, message: "Valid positive quantity required" });
      return;
    }
    const result = await boxService.restockBox(id as string, quantity);
    res.status(200).json({ success: true, data: result });
  }

  async getLowStock(req: Request, res: Response) {
    const threshold = req.query.threshold ? Number(req.query.threshold) : 10;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const result = await boxService.getLowStock(threshold, limit);
    res.status(200).json({ success: true, data: result });
  }

  async getByCategory(req: Request, res: Response) {
    const { categoryId } = req.params;
    const result = await boxService.getBoxesByCategory(categoryId as string);
    res.status(200).json({ success: true, ...result });
  }

  async getInventorySummary(req: Request, res: Response) {
    const result = await boxService.getInventorySummary();
    res.status(200).json({ success: true, data: result });
  }
}

export default new BoxController();