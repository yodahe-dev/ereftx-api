import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

interface SessionPerformanceAttributes {
  id: string;
  sessionId: string;
  date: Date;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  winRate: number;
  avgRR: number;
  profitFactor: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type SessionPerformanceCreationAttributes = Optional<
  SessionPerformanceAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export default (sequelize: Sequelize) => {
  class SessionPerformance
    extends Model<SessionPerformanceAttributes, SessionPerformanceCreationAttributes>
    implements SessionPerformanceAttributes
  {
    public id!: string;
    public sessionId!: string;
    public date!: Date;
    public totalTrades!: number;
    public winningTrades!: number;
    public losingTrades!: number;
    public grossProfit!: number;
    public grossLoss!: number;
    public netProfit!: number;
    public winRate!: number;
    public avgRR!: number;
    public profitFactor!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  SessionPerformance.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      sessionId: { type: DataTypes.UUID, allowNull: false, references: { model: 'trading_sessions', key: 'id' }, onDelete: 'CASCADE' },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      totalTrades: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      winningTrades: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      losingTrades: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      grossProfit: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      grossLoss: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      netProfit: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      winRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      avgRR: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
      profitFactor: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    },
    {
      sequelize,
      tableName: 'session_performance',
      timestamps: true,
      indexes: [{ fields: ['sessionId', 'date'], unique: true }],
    }
  );

  return SessionPerformance;
};