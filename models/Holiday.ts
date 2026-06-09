// models/Holiday.ts
import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

interface HolidayAttributes {
  id: string;
  date: Date;
  name: string;
  isGlobal: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type HolidayCreationAttributes = Optional<HolidayAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export default (sequelize: Sequelize) => {
  class Holiday extends Model<HolidayAttributes, HolidayCreationAttributes> implements HolidayAttributes {
    public id!: string;
    public date!: Date;
    public name!: string;
    public isGlobal!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Holiday.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      date: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      isGlobal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      tableName: 'holidays',
      timestamps: true,
      indexes: [{ fields: ['date'] }],
    }
  );
  return Holiday;
};