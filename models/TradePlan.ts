import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

export type PlanStatus = 'pending' | 'triggered' | 'expired' | 'cancelled';

interface TradePlanAttributes {
  id: string;
  accountId: string;
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number | null;
  lotSize: number;
  riskPercent: number;
  plannedDate: Date;
  expiryDate: Date | null;
  status: PlanStatus;
  // Optional: allow user to override plan after execution
  actualLotSize: number | null;      // if different from plan
  actualEntryPrice: number | null;   // if different
  actualExitPrice: number | null;    // if different
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type TradePlanCreationAttributes = Optional<
  TradePlanAttributes,
  'id' | 'takeProfit' | 'expiryDate' | 'status' | 'actualLotSize' | 'actualEntryPrice' | 'actualExitPrice' | 'notes' | 'createdAt' | 'updatedAt'
>;

export default (sequelize: Sequelize) => {
  class TradePlan
    extends Model<TradePlanAttributes, TradePlanCreationAttributes>
    implements TradePlanAttributes
  {
    public id!: string;
    public accountId!: string;
    public symbol!: string;
    public direction!: 'long' | 'short';
    public entryPrice!: number;
    public stopLoss!: number;
    public takeProfit!: number | null;
    public lotSize!: number;
    public riskPercent!: number;
    public plannedDate!: Date;
    public expiryDate!: Date | null;
    public status!: PlanStatus;
    public actualLotSize!: number | null;
    public actualEntryPrice!: number | null;
    public actualExitPrice!: number | null;
    public notes!: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  TradePlan.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      accountId: { type: DataTypes.UUID, allowNull: false, references: { model: 'trading_accounts', key: 'id' }, onDelete: 'CASCADE' },
      symbol: { type: DataTypes.STRING(20), allowNull: false },
      direction: { type: DataTypes.ENUM('long', 'short'), allowNull: false },
      entryPrice: { type: DataTypes.DECIMAL(18, 6), allowNull: false },
      stopLoss: { type: DataTypes.DECIMAL(18, 6), allowNull: false },
      takeProfit: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
      lotSize: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
      riskPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      plannedDate: { type: DataTypes.DATE, allowNull: false },
      expiryDate: { type: DataTypes.DATE, allowNull: true },
      status: { type: DataTypes.ENUM('pending', 'triggered', 'expired', 'cancelled'), allowNull: false, defaultValue: 'pending' },
      actualLotSize: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      actualEntryPrice: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
      actualExitPrice: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      tableName: 'trade_plans',
      timestamps: true,
      indexes: [{ fields: ['accountId'] }, { fields: ['status'] }, { fields: ['plannedDate'] }],
    }
  );

  return TradePlan;
};