// models/TradingSession.ts
import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

export type SessionName = 'Sydney' | 'Tokyo' | 'London' | 'NewYork';

interface TradingSessionAttributes {
  id: string;
  name: SessionName;
  abbreviation: string;
  timezone: string;          // IANA timezone (e.g., 'Australia/Sydney')
  localOpenHour: number;     // 0-23
  localOpenMinute: number;
  localCloseHour: number;
  localCloseMinute: number;
  priority: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type TradingSessionCreationAttributes = Optional<
  TradingSessionAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export default (sequelize: Sequelize) => {
  class TradingSession
    extends Model<TradingSessionAttributes, TradingSessionCreationAttributes>
    implements TradingSessionAttributes
  {
    public id!: string;
    public name!: SessionName;
    public abbreviation!: string;
    public timezone!: string;
    public localOpenHour!: number;
    public localOpenMinute!: number;
    public localCloseHour!: number;
    public localCloseMinute!: number;
    public priority!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  TradingSession.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.ENUM('Sydney', 'Tokyo', 'London', 'NewYork'), allowNull: false, unique: true },
      abbreviation: { type: DataTypes.STRING(10), allowNull: false },
      timezone: { type: DataTypes.STRING(50), allowNull: false },
      localOpenHour: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 0, max: 23 } },
      localOpenMinute: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 0, max: 59 } },
      localCloseHour: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 0, max: 23 } },
      localCloseMinute: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 0, max: 59 } },
      priority: { type: DataTypes.TINYINT, allowNull: false },
    },
    {
      sequelize,
      tableName: 'trading_sessions',
      timestamps: true,
      indexes: [{ fields: ['name'] }],
    }
  );

  return TradingSession;
};