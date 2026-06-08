import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

interface SessionScheduleAttributes {
  id: string;
  sessionId: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  openHourUTC: number;
  openMinuteUTC: number;
  closeHourUTC: number;
  closeMinuteUTC: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type SessionScheduleCreationAttributes = Optional<
  SessionScheduleAttributes,
  'id' | 'effectiveTo' | 'createdAt' | 'updatedAt'
>;

export default (sequelize: Sequelize) => {
  class SessionSchedule
    extends Model<SessionScheduleAttributes, SessionScheduleCreationAttributes>
    implements SessionScheduleAttributes
  {
    public id!: string;
    public sessionId!: string;
    public effectiveFrom!: Date;
    public effectiveTo!: Date | null;
    public openHourUTC!: number;
    public openMinuteUTC!: number;
    public closeHourUTC!: number;
    public closeMinuteUTC!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  SessionSchedule.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      sessionId: { type: DataTypes.UUID, allowNull: false, references: { model: 'trading_sessions', key: 'id' }, onDelete: 'CASCADE' },
      effectiveFrom: { type: DataTypes.DATE, allowNull: false },
      effectiveTo: { type: DataTypes.DATE, allowNull: true },
      openHourUTC: { type: DataTypes.TINYINT, allowNull: false },
      openMinuteUTC: { type: DataTypes.TINYINT, allowNull: false },
      closeHourUTC: { type: DataTypes.TINYINT, allowNull: false },
      closeMinuteUTC: { type: DataTypes.TINYINT, allowNull: false },
    },
    {
      sequelize,
      tableName: 'session_schedules',
      timestamps: true,
      indexes: [{ fields: ['sessionId', 'effectiveFrom'] }],
    }
  );

  return SessionSchedule;
};