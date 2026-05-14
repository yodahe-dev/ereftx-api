// modules/stocks/filtering/stockFilter.service.ts

import { Op, WhereOptions, Includeable } from 'sequelize';
import db from '../../../models';
import { StockFilterQuery, StockHistoryFilterQuery } from './stockFilter.schema';

const {
  Stock, Product, Brand, Category,
  ProductPrice, StockHistory,
} = db;

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

/**
 * Advanced filtering of Stock records.
 * Combines SQL filtering for fields that can be pushed to the DB,
 * and JS filtering for computed fields (totalUnits, stockValue).
 * Category filtering is done through Brand -> Category.
 */
export const getFilteredStocks = async (
  filters: StockFilterQuery
): Promise<PaginatedResult<any>> => {
  const {
    page, limit, sortBy, sortOrder,
    productName, brandId, categoryId,
    minBoxQuantity, maxBoxQuantity,
    minSingleQuantity, maxSingleQuantity,
    minTotalUnits, maxTotalUnits,
    minBuyPricePerBox, maxBuyPricePerBox,
    minSellPricePerBox, maxSellPricePerBox,
    valueBasedOn, minStockValue, maxStockValue,
    startDate, endDate,
  } = filters;

  // ── 1. Build WHERE on Product (fuzzy name, brand filter) ────
  const productWhere: any = {};
  if (productName) {
    // MySQL uses LIKE (case-insensitive if collation is case-insensitive)
    productWhere.name = { [Op.like]: `%${productName}%` };
  }
  if (brandId) {
    productWhere.brandId = brandId;
  }
  // categoryId is NOT added to productWhere – see includes below

  // ── 2. Build WHERE on ProductPrice (active price) ────────
  const priceWhere: any = { endAt: null };
  const priceFilters: any[] = [];
  if (minBuyPricePerBox !== undefined || maxBuyPricePerBox !== undefined) {
    const buyFilter: any = {};
    if (minBuyPricePerBox !== undefined) buyFilter[Op.gte] = minBuyPricePerBox;
    if (maxBuyPricePerBox !== undefined) buyFilter[Op.lte] = maxBuyPricePerBox;
    priceFilters.push({ buyPricePerBox: buyFilter });
  }
  if (minSellPricePerBox !== undefined || maxSellPricePerBox !== undefined) {
    const sellFilter: any = {};
    if (minSellPricePerBox !== undefined) sellFilter[Op.gte] = minSellPricePerBox;
    if (maxSellPricePerBox !== undefined) sellFilter[Op.lte] = maxSellPricePerBox;
    priceFilters.push({ sellPricePerBox: sellFilter });
  }
  if (priceFilters.length > 0) {
    priceWhere[Op.and] = priceFilters;
  }

  // ── 3. Build WHERE on Stock ─────────────────────────────
  const stockWhere: any = {};
  const quantityFilters: any[] = [];
  if (minBoxQuantity !== undefined || maxBoxQuantity !== undefined) {
    const boxFilter: any = {};
    if (minBoxQuantity !== undefined) boxFilter[Op.gte] = minBoxQuantity;
    if (maxBoxQuantity !== undefined) boxFilter[Op.lte] = maxBoxQuantity;
    quantityFilters.push({ boxQuantity: boxFilter });
  }
  if (minSingleQuantity !== undefined || maxSingleQuantity !== undefined) {
    const singleFilter: any = {};
    if (minSingleQuantity !== undefined) singleFilter[Op.gte] = minSingleQuantity;
    if (maxSingleQuantity !== undefined) singleFilter[Op.lte] = maxSingleQuantity;
    quantityFilters.push({ singleQuantity: singleFilter });
  }
  if (quantityFilters.length > 0) {
    stockWhere[Op.and] = quantityFilters;
  }

  if (startDate || endDate) {
    stockWhere.createdAt = {};
    if (startDate) stockWhere.createdAt[Op.gte] = startDate;
    if (endDate) stockWhere.createdAt[Op.lte] = endDate;
  }

  // ── 4. Build includes (Brand + optional nested Category) ─────
  const includes: Includeable[] = [];

  // Brand include – if categoryId is given, require brand and filter category
  const brandInclude: Includeable = {
    model: Brand,
    as: 'brand',
    attributes: ['id', 'name', 'categoryId'],
    required: true,                // always join brand (because every product has one)
    include: categoryId
      ? [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
            where: { id: categoryId },
            required: true,
          },
        ]
      : [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
            required: false,
          },
        ],
  };

  // ProductPrice include (inside product)
  const priceInclude: Includeable = {
    model: ProductPrice,
    as: 'prices',
    attributes: ['id', 'buyPricePerBox', 'sellPricePerBox', 'sellPricePerUnit'],
    where: priceWhere,
    required: Object.keys(priceWhere).length > 1, // only required if extra price filters
  };

  const productInclude: Includeable = {
    model: Product,
    as: 'product',
    attributes: ['id', 'name', 'unitsPerBox', 'brandId', 'packagingId'], // no categoryId
    include: [brandInclude, priceInclude],
    required: true,
  };

  if (Object.keys(productWhere).length > 0) {
    productInclude.where = productWhere;
  }

  includes.push(productInclude);

  // ── 5. Fetch from DB ─────────────────────────────────────
  const { rows } = await Stock.findAndCountAll({
    where: stockWhere,
    include: includes,
    // We fetch all rows because computed field filtering is done in JS.
    // For huge datasets, this should be replaced by SQL‑only filtering.
  });

  // ── 6. Enrich with computed fields ───────────────────────
  let result = rows.map((stock: any) => {
    const plain = stock.toJSON() as any;
    const product = plain.product ?? {};
    const unitsPerBox = product.unitsPerBox || 1;
    const totalUnits = plain.boxQuantity * unitsPerBox + plain.singleQuantity;

    // active price is the first (and only) from the nested include
    const activePrice = product?.prices?.[0];
    let stockValue = 0;
    if (activePrice) {
      const buyPricePerBox = Number(activePrice.buyPricePerBox);
      const sellPricePerBox = Number(activePrice.sellPricePerBox);
      const sellPricePerUnit = Number(activePrice.sellPricePerUnit);
      if (valueBasedOn === 'buy') {
        const buyPricePerUnit = buyPricePerBox / unitsPerBox;
        stockValue = plain.boxQuantity * buyPricePerBox + plain.singleQuantity * buyPricePerUnit;
      } else {
        stockValue = plain.boxQuantity * sellPricePerBox + plain.singleQuantity * sellPricePerUnit;
      }
    }
    return { ...plain, totalUnits, stockValue: Math.round(stockValue * 100) / 100 };
  });

  // ── 7. Apply JS filters for computed fields ──────────────
  if (minTotalUnits !== undefined) {
    result = result.filter((s: any) => s.totalUnits >= minTotalUnits);
  }
  if (maxTotalUnits !== undefined) {
    result = result.filter((s: any) => s.totalUnits <= maxTotalUnits);
  }
  if (minStockValue !== undefined) {
    result = result.filter((s: any) => s.stockValue >= minStockValue);
  }
  if (maxStockValue !== undefined) {
    result = result.filter((s: any) => s.stockValue <= maxStockValue);
  }

  // ── 8. Sort ──────────────────────────────────────────────
  if (sortBy === 'totalUnits') {
    result.sort((a: any, b: any) =>
      (sortOrder === 'ASC' ? 1 : -1) * (a.totalUnits - b.totalUnits)
    );
  } else if (sortBy === 'stockValue') {
    result.sort((a: any, b: any) =>
      (sortOrder === 'ASC' ? 1 : -1) * (a.stockValue - b.stockValue)
    );
  } else if (sortBy === 'buyPricePerBox' || sortBy === 'sellPricePerBox') {
    result.sort((a: any, b: any) => {
      const aVal = a.product?.prices?.[0]?.[sortBy]
        ? Number(a.product.prices[0][sortBy])
        : 0;
      const bVal = b.product?.prices?.[0]?.[sortBy]
        ? Number(b.product.prices[0][sortBy])
        : 0;
      return (sortOrder === 'ASC' ? 1 : -1) * (aVal - bVal);
    });
  } else {
    // default sort by DB field
    result.sort((a: any, b: any) => {
      const aVal = a[sortBy as string] ?? 0;
      const bVal = b[sortBy as string] ?? 0;
      return (sortOrder === 'ASC' ? 1 : -1) * (Number(aVal) - Number(bVal));
    });
  }

  // ── 9. Paginate ─────────────────────────────────────────
  const totalItems = result.length;
  const totalPages = Math.ceil(totalItems / limit);
  const offset = (page - 1) * limit;
  const paginatedData = result.slice(offset, offset + limit);

  return {
    data: paginatedData,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      pageSize: limit,
    },
  };
};

/**
 * Advanced filtering for StockHistory records.
 */
export const getFilteredStockHistory = async (
  filters: StockHistoryFilterQuery
): Promise<PaginatedResult<any>> => {
  const {
    page, limit, sortBy, sortOrder,
    productId, actionType, startDate, endDate,
    notes, isFree,
    minBoxChange, maxBoxChange,
    minSingleChange, maxSingleChange,
  } = filters;

  const where: WhereOptions = {};
  if (productId) where.productId = productId;
  if (actionType) where.actionType = actionType;
  if (isFree !== undefined) where.isFree = isFree;
  if (notes) {
    where.notes = { [Op.like]: `%${notes}%` }; // also fixed here
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = startDate;
    if (endDate) where.createdAt[Op.lte] = endDate;
  }
  if (minBoxChange !== undefined || maxBoxChange !== undefined) {
    (where as any).boxQuantityChange = {};
    if (minBoxChange !== undefined) (where as any).boxQuantityChange[Op.gte] = minBoxChange;
    if (maxBoxChange !== undefined) (where as any).boxQuantityChange[Op.lte] = maxBoxChange;
  }
  if (minSingleChange !== undefined || maxSingleChange !== undefined) {
    (where as any).singleQuantityChange = {};
    if (minSingleChange !== undefined) (where as any).singleQuantityChange[Op.gte] = minSingleChange;
    if (maxSingleChange !== undefined) (where as any).singleQuantityChange[Op.lte] = maxSingleChange;
  }

  const { count, rows } = await StockHistory.findAndCountAll({
    where,
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name'] },
      { model: ProductPrice, as: 'price', attributes: ['buyPricePerBox', 'sellPricePerBox'] },
    ],
    order: [[sortBy, sortOrder]],
    offset: (page - 1) * limit,
    limit,
  });

  return {
    data: rows,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
    },
  };
};