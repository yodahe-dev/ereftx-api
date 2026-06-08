import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

interface UserTradingScheduleAttributes {
  id: string;
  userId: string;
  sessionId: string | null;
  dayOfWeek: number;
  startHourLocal: number;
  startMinuteLocal: number;
  endHourLocal: number;
  endMinuteLocal: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserTradingScheduleCreationAttributes = Optional<
  UserTradingScheduleAttributes,
  'id' | 'sessionId' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export default (sequelize: Sequelize) => {
  class UserTradingSchedule
    extends Model<UserTradingScheduleAttributes, UserTradingScheduleCreationAttributes>
    implements UserTradingScheduleAttributes
  {
    public id!: string;
    public userId!: string;
    public sessionId!: string | null;
    public dayOfWeek!: number;
    public startHourLocal!: number;
    public startMinuteLocal!: number;
    public endHourLocal!: number;
    public endMinuteLocal!: number;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  UserTradingSchedule.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      sessionId: { type: DataTypes.UUID, allowNull: true, references: { model: 'trading_sessions', key: 'id' }, onDelete: 'SET NULL' },
      dayOfWeek: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 0, max: 6 } },
      startHourLocal: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 0, max: 23 } },
      startMinuteLocal: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 0, max: 59 } },
      endHourLocal: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 0, max: 23 } },
      endMinuteLocal: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 0, max: 59 } },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      tableName: 'user_trading_schedules',
      timestamps: true,
      indexes: [{ fields: ['userId'] }, { fields: ['dayOfWeek'] }],
    }
  );

  return UserTradingSchedule;
};