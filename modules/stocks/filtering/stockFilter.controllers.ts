// modules/stocks/filtering/stockFilter.controllers.ts

import { Request, Response } from 'express';
import { stockFilterQuerySchema, stockHistoryFilterQuerySchema } from './stockFilter.schema';
import { getFilteredStocks, getFilteredStockHistory } from './stockFilter.service';
import { ZodError } from 'zod';

export const filterStocks = async (req: Request, res: Response) => {
  try {
    const query = stockFilterQuerySchema.parse(req.query);
    const result = await getFilteredStocks(query);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: error.flatten(),
      });
    }
    console.error('FILTER STOCKS ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const filterStockHistory = async (req: Request, res: Response) => {
  try {
    const query = stockHistoryFilterQuerySchema.parse(req.query);
    const result = await getFilteredStockHistory(query);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: error.flatten(),
      });
    }
    console.error('FILTER STOCK HISTORY ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};