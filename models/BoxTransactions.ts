import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface BoxTransactionsAttributes {
  id: string;
  customername: string;
  customerphone: string;
  customermoney: number;
  soldmoney: number;
  profit: number;
  note: string;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type BoxTransactionsCreationAttributes = Optional<
  BoxTransactionsAttributes,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
  | "soldmoney"
  | "customermoney"
  | "profit"
  | "note"
>;

export default (sequelize: Sequelize) => {
  class BoxTransactions
    extends Model<BoxTransactionsAttributes, BoxTransactionsCreationAttributes>
    implements BoxTransactionsAttributes
  {
    public id!: string;
    public customername!: string;
    public customerphone!: string;
    public customermoney!: number;
    public soldmoney!: number;
    public profit!: number;
    public note!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date | null;
  }

  BoxTransactions.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      customername: {
        type: DataTypes.STRING(120),
        allowNull: false,
        set(value: string) {
          this.setDataValue("customername", value.trim());
        },
      },

      customerphone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        set(value: string) {
          this.setDataValue("customerphone", value.trim());
        },
      },

      customermoney: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },

      soldmoney: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },

      profit: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },

      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "BoxTransactions",
      timestamps: true,
      paranoid: true,
    }
  );

  return BoxTransactions;
};