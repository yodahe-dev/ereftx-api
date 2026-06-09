// analytics/TradePlan.analyzer.ts
import db from '../models';
import { Op } from 'sequelize';

const { TradePlan, Trade } = db;

export class TradePlanAnalyzer {
  /**
   * Get best performing plan (by profit of executed trade).
   */
  static async getBestPlan(accountId: string): Promise<any> {
    const plan = await TradePlan.findOne({
      where: { accountId, status: 'triggered' },
      include: [{ model: Trade, as: 'executedTrade', where: { pnl: { [Op.gt]: 0 } }, required: true }],
      order: [[{ model: Trade, as: 'executedTrade' }, 'pnl', 'DESC']],
    });
    return plan;
  }

  /**
   * Get worst performing plan (by loss).
   */
  static async getWorstPlan(accountId: string): Promise<any> {
    const plan = await TradePlan.findOne({
      where: { accountId, status: 'triggered' },
      include: [{ model: Trade, as: 'executedTrade', where: { pnl: { [Op.lt]: 0 } }, required: true }],
      order: [[{ model: Trade, as: 'executedTrade' }, 'pnl', 'ASC']],
    });
    return plan;
  }

  /**
   * Get average deviation between planned and actual entry prices.
   */
  static async getAverageDeviation(accountId: string): Promise<{ avgPriceDeviation: number; avgLotDeviation: number }> {
    const plans = await TradePlan.findAll({
      where: { accountId, status: 'triggered', actualEntryPrice: { [Op.not]: null }, actualLotSize: { [Op.not]: null } },
      attributes: ['entryPrice', 'actualEntryPrice', 'lotSize', 'actualLotSize'],
    });

    let priceDevSum = 0;
    let lotDevSum = 0;
    let count = 0;
    for (const p of plans) {
      priceDevSum += Math.abs(p.entryPrice - p.actualEntryPrice!);
      lotDevSum += Math.abs(p.lotSize - p.actualLotSize!);
      count++;
    }
    return {
      avgPriceDeviation: count ? priceDevSum / count : 0,
      avgLotDeviation: count ? lotDevSum / count : 0,
    };
  }
}