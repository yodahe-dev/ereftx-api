import { Request, Response } from "express";
import boxTransactionService from "./service/boxTransactions.service";
import {
  CreateBoxTransactionSchema,
  UpdateBoxTransactionSchema,
  AddItemSchema,
  UpdateItemSchema,
  BoxTransactionQuerySchema,
} from "./validations/boxTransactions.schema";

export class BoxTransactionsController {
  async create(req: Request, res: Response) {
    const validatedData = CreateBoxTransactionSchema.parse(req.body);
    const result = await boxTransactionService.createTransaction(validatedData);
    res.status(201).json({ success: true, data: result });
  }

  async getAll(req: Request, res: Response) {
    const validatedQuery = BoxTransactionQuerySchema.parse(req.query);
    const result = await boxTransactionService.getAllTransactions(validatedQuery);
    res.status(200).json({ success: true, ...result });
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await boxTransactionService.getTransactionById(id as string);
    res.status(200).json({ success: true, data: result });
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const validatedData = UpdateBoxTransactionSchema.parse(req.body);
    const result = await boxTransactionService.updateTransactionHeader(id as string, validatedData);
    res.status(200).json({ success: true, data: result });
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const result = await boxTransactionService.deleteTransaction(id as string);
    res.status(200).json(result);
  }

  async addItem(req: Request, res: Response) {
    const { id } = req.params;
    const validatedData = AddItemSchema.parse(req.body);
    const result = await boxTransactionService.addItem(id as string, validatedData);
    res.status(201).json({ success: true, data: result });
  }

  async updateItem(req: Request, res: Response) {
    const { id, itemId } = req.params;
    const validatedData = UpdateItemSchema.parse(req.body);
    const result = await boxTransactionService.updateItem(id as string, itemId as string, validatedData);
    res.status(200).json({ success: true, data: result });
  }

  async deleteItem(req: Request, res: Response) {
    const { id, itemId } = req.params;
    const result = await boxTransactionService.removeItem(id as string, itemId as string);
    res.status(200).json(result);
  }
}

export default new BoxTransactionsController();