// modules/stocks/filtering/stockFilter.schema.ts

import { z } from 'zod';

// ── Stock Filter Query ──────────────────────────────────────
export const stockFilterQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),

  // Sorting
  sortBy: z.enum([
    'createdAt', 'updatedAt', 'boxQuantity', 'singleQuantity',
    'totalUnits', 'buyPricePerBox', 'sellPricePerBox', 'stockValue'
  ]).optional().default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),

  // Fuzzy search on product name
  productName: z.string().optional(),

  // Filter by brand / category
  brandId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),

  // Quantity ranges (absolute)
  minBoxQuantity: z.coerce.number().int().min(0).optional(),
  maxBoxQuantity: z.coerce.number().int().min(0).optional(),
  minSingleQuantity: z.coerce.number().int().min(0).optional(),
  maxSingleQuantity: z.coerce.number().int().min(0).optional(),

  // Total units range (computed: boxes * unitsPerBox + singles)
  minTotalUnits: z.coerce.number().int().min(0).optional(),
  maxTotalUnits: z.coerce.number().int().min(0).optional(),

  // Price ranges (of the active price)
  minBuyPricePerBox: z.coerce.number().min(0).optional(),
  maxBuyPricePerBox: z.coerce.number().min(0).optional(),
  minSellPricePerBox: z.coerce.number().min(0).optional(),
  maxSellPricePerBox: z.coerce.number().min(0).optional(),

  // Stock value ranges (inventory cost or retail)
  valueBasedOn: z.enum(['buy', 'sell']).optional().default('buy'),
  minStockValue: z.coerce.number().min(0).optional(),
  maxStockValue: z.coerce.number().min(0).optional(),

  // Creation date range
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type StockFilterQuery = z.infer<typeof stockFilterQuerySchema>;

// ── Stock History Filter Query ──────────────────────────────
export const stockHistoryFilterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),

  sortBy: z.enum([
    'createdAt', 'boxQuantityChange', 'singleQuantityChange'
  ]).optional().default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),

  productId: z.string().uuid().optional(),
  actionType: z.enum(['restock', 'adjust', 'exchange', 'initial', 'sale']).optional(),

  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),

  notes: z.string().optional(),
  isFree: z.coerce.boolean().optional(),

  minBoxChange: z.coerce.number().int().optional(),
  maxBoxChange: z.coerce.number().int().optional(),
  minSingleChange: z.coerce.number().int().optional(),
  maxSingleChange: z.coerce.number().int().optional(),
});

export type StockHistoryFilterQuery = z.infer<typeof stockHistoryFilterQuerySchema>;