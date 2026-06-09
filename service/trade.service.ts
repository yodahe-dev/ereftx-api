import db from '../models';
import { FilterBuilder, FilterCondition } from '../search/filter.builder';

const { TradingSession, TradingAccount } = db;

export class TradeService {
  static async create(data: any): Promise<any> {
    if (!data.openSessionId && data.openTimestamp) {
    }
    const trade = await db.Trade.create(data);
    return trade;
  }

  static async getById(id: string): Promise<any> {
    const trade = await db.Trade.findByPk(id, {
      include: [
        { model: TradingSession, as: 'openSession' },
        { model: TradingSession, as: 'closeSession' },
        { model: TradingAccount, as: 'account' },
      ],
    });
    if (!trade) throw new Error('Trade not found');
    return trade;
  }

  static async update(id: string, data: any): Promise<any> {
    const trade = await this.getById(id);
    await trade.update(data);
    return trade;
  }

  static async delete(id: string): Promise<void> {
    const trade = await this.getById(id);
    await trade.destroy();
  }

  static async list(filters: FilterCondition[], page: number = 1, limit: number = 50): Promise<any> {
    const builder = new FilterBuilder();
    for (const f of filters) builder.addCondition(f);
    builder.setPagination(limit, page);
    builder.setOrder([['openTimestamp', 'DESC']]);
    builder.addInclude(TradingSession, 'openSession', false);
    const { where, order, include, limit: l, offset } = builder.build();

    const { rows, count } = await db.Trade.findAndCountAll({
      where,
      order,
      include,
      limit: l,
      offset,
    });
    return { rows, total: count, page, limit };
  }
}