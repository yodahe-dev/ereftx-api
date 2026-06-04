import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export type ExpensePlanStatus = "planned" | "active" | "completed" | "cancelled";

interface ExpensePlanAttributes {
  id: string;
  title: string;
  targetAmount: number;
  currentAllocatedAmount: number;
  targetDate?: Date | null;
  status: ExpensePlanStatus;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type ExpensePlanCreationAttributes = Optional<
  ExpensePlanAttributes,
  "id" | "currentAllocatedAmount" | "targetDate" | "status" | "notes" | "createdAt" | "updatedAt"
>;

export default (sequelize: Sequelize) => {
  class ExpensePlan
    extends Model<ExpensePlanAttributes, ExpensePlanCreationAttributes>
    implements ExpensePlanAttributes
  {
    public id!: string;
    public title!: string;
    public targetAmount!: number;
    public currentAllocatedAmount!: number;
    public targetDate!: Date | null;
    public status!: ExpensePlanStatus;
    public notes!: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  ExpensePlan.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
        set(value: string) {
          this.setDataValue("title", value.trim());
        },
      },
      targetAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 },
        get() {
          return Number(this.getDataValue("targetAmount"));
        },
      },
      currentAllocatedAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
        get() {
          return Number(this.getDataValue("currentAllocatedAmount"));
        },
      },
      targetDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("planned", "active", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "planned",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "expense_plans",
      timestamps: true,
    }
  );

  return ExpensePlan;
};