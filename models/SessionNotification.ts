import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

interface SessionNotificationAttributes {
  id: string;
  sessionId: string;
  minutesBefore: number;
  channel: 'email' | 'push' | 'telegram';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type SessionNotificationCreationAttributes = Optional<
  SessionNotificationAttributes,
  'id' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export default (sequelize: Sequelize) => {
  class SessionNotification
    extends Model<SessionNotificationAttributes, SessionNotificationCreationAttributes>
    implements SessionNotificationAttributes
  {
    public id!: string;
    public sessionId!: string;
    public minutesBefore!: number;
    public channel!: 'email' | 'push' | 'telegram';
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  SessionNotification.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      sessionId: { type: DataTypes.UUID, allowNull: false, references: { model: 'trading_sessions', key: 'id' }, onDelete: 'CASCADE' },
      minutesBefore: { type: DataTypes.SMALLINT, allowNull: false, validate: { min: 1, max: 1440 } },
      channel: { type: DataTypes.ENUM('email', 'push', 'telegram'), allowNull: false },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      tableName: 'session_notifications',
      timestamps: true,
      indexes: [{ fields: ['sessionId'] }],
    }
  );

  return SessionNotification;
};