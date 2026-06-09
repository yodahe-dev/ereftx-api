// graph/TradePlan.distribution.processor.ts
import { Sequelize } from 'sequelize';
import db from '../models';

const { TradePlan, Trade } = db;
type StatusDistribution = {
  status: string;
  count: number;
};

export class TradePlanDistributionProcessor {
  /**
   * Get win rate of triggered plans vs actual trades.
   */
  static async getPlanWinRate(accountId: string): Promise<{ totalTriggered: number; winningPlans: number; winRate: number }> {
    const plans: any[] = await TradePlan.findAll({
      where: { accountId, status: 'triggered' },
      include: [{ model: Trade, as: 'executedTrade', attributes: ['pnl'] }],
    });

    let winning = 0;
    for (const plan of plans) {
      const trade = (plan as any).executedTrade;
      if (trade && trade.pnl > 0) winning++;
    }
    const total = plans.length;
    return {
      totalTriggered: total,
      winningPlans: winning,
      winRate: total ? (winning / total) * 100 : 0,
    };
  }

  /**
   * Get distribution of plan statuses.
   */
static async getPlanStatusDistribution(
  accountId: string
): Promise<StatusDistribution[]> {
  const counts = await TradePlan.findAll({
    where: { accountId },
    attributes: [
      'status',
      [Sequelize.fn('COUNT', Sequelize.col('status')), 'count'],
    ],
    group: ['status'],
    raw: true,
  });

  return counts as unknown as StatusDistribution[];
}
}