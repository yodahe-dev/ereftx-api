import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

export type TradeDirection = 'long' | 'short';
export type TradeStatus = 'open' | 'closed' | 'cancelled';
export type LiquidityType = 'buyStop' | 'sellStop' | 'buyLimit' | 'sellLimit' | 'market';
export type MSS_Type = 'bearish' | 'bullish' | 'none';

interface TradeAttributes {
  id: string;
  accountId: string;
  symbol: string;
  direction: TradeDirection;
  status: TradeStatus;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number;
  takeProfit: number | null;
  lotSize: number;
  riskPercent: number;          // % of account risked
  pnl: number;                  // realised profit/loss
  pips: number | null;
  swap: number | null;
  commission: number | null;
  // Market structure flags
  liquiditySweep: boolean;
  mss: MSS_Type;
  bos: boolean;
  premiumDiscount: 'premium' | 'discount' | 'neutral';
  // Session & time tracking
  openSessionId: string | null;
  closeSessionId: string | null;
  openOverlapId: string | null;
  closeOverlapId: string | null;
  openTimestamp: Date;
  closeTimestamp: Date | null;
  // Forward planning (flexible: link to plan but allow deviation)
  plannedEntryId: string | null;
  // Risk rule violation flags (NEW – flexible)
  violatesRiskRules: boolean;
  riskViolationDetails: object | null;   // JSON detailing which rule(s) were violated
  isEmergencyExit: boolean;              // if user exited due to market spike
  deviationFromPlan: boolean;            // if actual differs from plan
  // Psychological / journal
  emotion: string | null;
  mistake: string | null;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type TradeCreationAttributes = Optional<
  TradeAttributes,
  'id' | 'exitPrice' | 'takeProfit' | 'pnl' | 'pips' | 'swap' | 'commission' | 'mss' | 'bos' |
  'premiumDiscount' | 'openSessionId' | 'closeSessionId' | 'openOverlapId' | 'closeOverlapId' |
  'closeTimestamp' | 'plannedEntryId' | 'violatesRiskRules' | 'riskViolationDetails' | 'isEmergencyExit' |
  'deviationFromPlan' | 'emotion' | 'mistake' | 'notes' | 'createdAt' | 'updatedAt'
>;

export default (sequelize: Sequelize) => {
  class Trade
    extends Model<TradeAttributes, TradeCreationAttributes>
    implements TradeAttributes
  {
    public id!: string;
    public accountId!: string;
    public symbol!: string;
    public direction!: TradeDirection;
    public status!: TradeStatus;
    public entryPrice!: number;
    public exitPrice!: number | null;
    public stopLoss!: number;
    public takeProfit!: number | null;
    public lotSize!: number;
    public riskPercent!: number;
    public pnl!: number;
    public pips!: number | null;
    public swap!: number | null;
    public commission!: number | null;
    public liquiditySweep!: boolean;
    public mss!: MSS_Type;
    public bos!: boolean;
    public premiumDiscount!: 'premium' | 'discount' | 'neutral';
    public openSessionId!: string | null;
    public closeSessionId!: string | null;
    public openOverlapId!: string | null;
    public closeOverlapId!: string | null;
    public openTimestamp!: Date;
    public closeTimestamp!: Date | null;
    public plannedEntryId!: string | null;
    public violatesRiskRules!: boolean;
    public riskViolationDetails!: object | null;
    public isEmergencyExit!: boolean;
    public deviationFromPlan!: boolean;
    public emotion!: string | null;
    public mistake!: string | null;
    public notes!: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Trade.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      accountId: { type: DataTypes.UUID, allowNull: false, references: { model: 'trading_accounts', key: 'id' }, onDelete: 'CASCADE' },
      symbol: { type: DataTypes.STRING(20), allowNull: false },
      direction: { type: DataTypes.ENUM('long', 'short'), allowNull: false },
      status: { type: DataTypes.ENUM('open', 'closed', 'cancelled'), allowNull: false, defaultValue: 'open' },
      entryPrice: { type: DataTypes.DECIMAL(18, 6), allowNull: false },
      exitPrice: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
      stopLoss: { type: DataTypes.DECIMAL(18, 6), allowNull: false },
      takeProfit: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
      lotSize: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } }, // allow 0? but we keep min:0
      riskPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 1 },
      pnl: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0, get() { return Number(this.getDataValue('pnl')); } },
      pips: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      swap: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      commission: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      liquiditySweep: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      mss: { type: DataTypes.ENUM('bearish', 'bullish', 'none'), allowNull: false, defaultValue: 'none' },
      bos: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      premiumDiscount: { type: DataTypes.ENUM('premium', 'discount', 'neutral'), allowNull: false, defaultValue: 'neutral' },
      openSessionId: { type: DataTypes.UUID, allowNull: true, references: { model: 'trading_sessions', key: 'id' } },
      closeSessionId: { type: DataTypes.UUID, allowNull: true, references: { model: 'trading_sessions', key: 'id' } },
      openOverlapId: { type: DataTypes.UUID, allowNull: true, references: { model: 'trading_sessions', key: 'id' } },
      closeOverlapId: { type: DataTypes.UUID, allowNull: true, references: { model: 'trading_sessions', key: 'id' } },
      openTimestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      closeTimestamp: { type: DataTypes.DATE, allowNull: true },
      plannedEntryId: { type: DataTypes.UUID, allowNull: true, references: { model: 'trade_plans', key: 'id' } },
      violatesRiskRules: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      riskViolationDetails: { type: DataTypes.JSON, allowNull: true },
      isEmergencyExit: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      deviationFromPlan: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      emotion: { type: DataTypes.STRING(100), allowNull: true },
      mistake: { type: DataTypes.STRING(255), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      tableName: 'trades',
      timestamps: true,
      indexes: [
        { fields: ['accountId'] },
        { fields: ['openTimestamp'] },
        { fields: ['status'] },
        { fields: ['openSessionId'] },
        { fields: ['symbol'] },
        { fields: ['openOverlapId'] },
        { fields: ['violatesRiskRules'] },
      ],
    }
  );

  return Trade;
};