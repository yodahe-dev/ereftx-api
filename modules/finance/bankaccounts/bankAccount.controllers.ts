// modules/bankaccounts/bankAccount.controllers.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createBankAccountSchema,
  updateBankAccountSchema,
  bankAccountSearchSchema,
} from './bankAccount.schema';
import { createBankAccount, getBankAccountById, updateBankAccount, deleteBankAccount } from './bankAccount.service';
import { advancedSearch } from './bankAccount.query';
import { isUUID } from 'validator'; // or use uuid package

function getId(req: Request): string | null {
  const id = req.params.id;
  if (typeof id !== 'string' || !isUUID(id, 4)) return null;
  return id;
}

// ---------- CRUD ----------
export async function createAccount(req: Request, res: Response) {
  try {
    const validated = createBankAccountSchema.parse(req.body);
    const account = await createBankAccount(validated);
    res.status(201).json({ success: true, data: account });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('CREATE BANK ACCOUNT ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getAccount(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const account = await getBankAccountById(id);
    res.json({ success: true, data: account });
  } catch (error: any) {
    console.error('GET BANK ACCOUNT ERROR:', error);
    res.status(error.message === 'Bank account not found' ? 404 : 500).json({ message: error.message });
  }
}

export async function updateAccount(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const validated = updateBankAccountSchema.parse(req.body);
    const account = await updateBankAccount(id, validated);
    res.json({ success: true, data: account });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('UPDATE BANK ACCOUNT ERROR:', error);
    res.status(error.message === 'Bank account not found' ? 404 : 500).json({ message: error.message });
  }
}

export async function deleteAccount(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const result = await deleteBankAccount(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('DELETE BANK ACCOUNT ERROR:', error);
    res.status(error.message === 'Bank account not found' ? 404 : 500).json({ message: error.message });
  }
}

// ---------- Advanced Search ----------
export async function searchAccounts(req: Request, res: Response) {
  try {
    const query = bankAccountSearchSchema.parse(req.query);
    const { data, total } = await advancedSearch(query);
    res.json({
      success: true,
      data,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < total,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid query', errors: error.flatten() });
    console.error('SEARCH BANK ACCOUNTS ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}