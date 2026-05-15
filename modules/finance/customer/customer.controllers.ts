import { Request, Response } from 'express';
import { z } from 'zod';
import { createCustomer, updateCustomer, deleteCustomer } from './customer.service';
import { searchCustomers } from './customer.query';
import { createCustomerSchema, updateCustomerSchema, customerSearchSchema } from './customer.schema';
import { isUUID } from 'validator';

function getId(req: Request): string | null {
  const id = req.params.id;
    if (typeof id !== 'string') return null;
    return isUUID(id, 4) ? id : null;
}

export async function createCustomerHandler(req: Request, res: Response) {
  try {
    const validated = createCustomerSchema.parse(req.body);
    const customer = await createCustomer(validated);
    res.status(201).json({ success: true, data: customer });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('CREATE CUSTOMER ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function updateCustomerHandler(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const validated = updateCustomerSchema.parse(req.body);
    const customer = await updateCustomer(id, validated);
    res.json({ success: true, data: customer });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('UPDATE CUSTOMER ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function deleteCustomerHandler(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const result = await deleteCustomer(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('DELETE CUSTOMER ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function searchCustomersHandler(req: Request, res: Response) {
  try {
    const query = customerSearchSchema.parse(req.query);
    const { data, total } = await searchCustomers(query);
    res.json({
      success: true,
      data,
      pagination: { total, limit: query.limit, offset: query.offset, hasMore: query.offset + query.limit < total },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid query', errors: error.flatten() });
    console.error('SEARCH CUSTOMERS ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}