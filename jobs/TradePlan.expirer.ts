// jobs/TradePlan.expirer.ts
import cron from 'node-cron';
import db from '../models';
import { Op } from 'sequelize';

const { TradePlan } = db;

export class TradePlanExpirer {
  static async expirePlans(): Promise<void> {
    const now = new Date();
    const [affectedCount] = await TradePlan.update(
      { status: 'expired' },
      {
        where: {
          status: 'pending',
          expiryDate: { [Op.lt]: now },
        },
      }
    );
    if (affectedCount) {
      console.log(`[TradePlanExpirer] Expired ${affectedCount} plans`);
    }
  }

  static start(): void {
    // Run every hour at minute 15
    cron.schedule('15 * * * *', async () => {
      console.log('[TradePlanExpirer] Running...');
      try {
        await this.expirePlans();
      } catch (err) {
        console.error('[TradePlanExpirer] Error:', err);
      }
    });
  }
}