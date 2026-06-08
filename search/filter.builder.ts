// search/filter.builder.ts
import { Op, WhereOptions, Includeable } from 'sequelize';

export type FilterOperator = 
  | 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' 
  | 'between' | 'in' | 'contains' | 'startsWith' | 'endsWith';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

export class FilterBuilder {
  private where: Record<string, any> = {};
  private order: Array<[string, 'ASC' | 'DESC']> = [];
  private include: Includeable[] = [];
  private limit: number = 100;
  private offset: number = 0;

  private indexedFields: Set<string> = new Set([
    'accountId',
    'symbol',
    'status',
    'openSessionId',
    'openTimestamp',
    'id',
    'closeSessionId'
  ]);

  addCondition(cond: FilterCondition): this {
    const field = cond.field;

    switch (cond.operator) {
      case 'eq':
        this.where[field] = cond.value;
        break;

      case 'ne':
        this.where[field] = { [Op.ne]: cond.value };
        break;

      case 'gt':
        this.where[field] = { [Op.gt]: cond.value };
        break;

      case 'gte':
        this.where[field] = { [Op.gte]: cond.value };
        break;

      case 'lt':
        this.where[field] = { [Op.lt]: cond.value };
        break;

      case 'lte':
        this.where[field] = { [Op.lte]: cond.value };
        break;

      case 'between':
        this.where[field] = { [Op.between]: cond.value };
        break;

      case 'in':
        if (Array.isArray(cond.value) && cond.value.length > 100) {
          console.warn(
            `Large IN list (${cond.value.length}) for field ${field}. Consider splitting.`
          );
        }
        this.where[field] = { [Op.in]: cond.value };
        break;

      case 'contains':
        this.where[field] = { [Op.like]: `%${cond.value}%` };
        break;

      case 'startsWith':
        this.where[field] = { [Op.startsWith]: cond.value };
        break;

      case 'endsWith':
        this.where[field] = { [Op.endsWith]: cond.value };
        break;
    }

    return this;
  }

  addDateRange(field: string, start: Date, end: Date): this {
    this.where[field] = { [Op.between]: [start, end] };
    return this;
  }

  addIn(field: string, values: any[]): this {
    return this.addCondition({ field, operator: 'in', value: values });
  }

  addInclude(model: any, as?: string, required: boolean = false): this {
    this.include.push({ model, as, required });
    return this;
  }

  setPagination(limit: number, page: number): this {
    this.limit = limit;
    this.offset = (page - 1) * limit;
    return this;
  }

  setOrder(order: Array<[string, 'ASC' | 'DESC']>): this {
    this.order = order;
    return this;
  }

  build(): {
    where: WhereOptions;
    order: Array<[string, 'ASC' | 'DESC']>;
    include: Includeable[];
    limit: number;
    offset: number;
  } {
    const hasIndexed = Object.keys(this.where).some(k =>
      this.indexedFields.has(k)
    );

    if (!hasIndexed && Object.keys(this.where).length > 0) {
      if (this.order.length === 0) {
        this.order = [['id', 'ASC']];
      }
    }

    return {
      where: this.where,
      order: this.order,
      include: this.include,
      limit: this.limit,
      offset: this.offset
    };
  }
}