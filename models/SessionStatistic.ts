import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

interface SessionStatisticAttributes {
  id: string;
  accountId: string;
  metricDate: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
  hourOfDay: number | null;
  dayOfWeek: number | null;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number | null;
  standardDeviation: number | null;
  expectancy: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type SessionStatisticCreationAttributes = Optional<
  SessionStatisticAttributes,
  'id' | 'hourOfDay' | 'dayOfWeek' | 'sharpeRatio' | 'standardDeviation' | 'expectancy' | 'createdAt' | 'updatedAt'
>;

export default (sequelize: Sequelize) => {
  class SessionStatistic
    extends Model<SessionStatisticAttributes, SessionStatisticCreationAttributes>
    implements SessionStatisticAttributes
  {
    public id!: string;
    public accountId!: string;
    public metricDate!: Date;
    public granularity!: 'hour' | 'day' | 'week' | 'month';
    public hourOfDay!: number | null;
    public dayOfWeek!: number | null;
    public totalTrades!: number;
    public winRate!: number;
    public profitFactor!: number;
    public sharpeRatio!: number | null;
    public standardDeviation!: number | null;
    public expectancy!: number | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  SessionStatistic.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      accountId: { type: DataTypes.UUID, allowNull: false, references: { model: 'trading_accounts', key: 'id' }, onDelete: 'CASCADE' },
      metricDate: { type: DataTypes.DATE, allowNull: false },
      granularity: { type: DataTypes.ENUM('hour', 'day', 'week', 'month'), allowNull: false },
      hourOfDay: { type: DataTypes.TINYINT, allowNull: true },
      dayOfWeek: { type: DataTypes.TINYINT, allowNull: true },
      totalTrades: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      winRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      profitFactor: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      sharpeRatio: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      standardDeviation: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
      expectancy: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    },
    {
      sequelize,
      tableName: 'session_statistics',
      timestamps: true,
      indexes: [
        { fields: ['accountId', 'granularity', 'metricDate'] },
        { fields: ['accountId', 'hourOfDay'] },
        { fields: ['accountId', 'dayOfWeek'] },
      ],
    }
  );

  return SessionStatistic;
};