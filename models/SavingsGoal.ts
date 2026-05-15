// models/SavingsGoal.ts
import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export enum GoalStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  PAUSED = "paused",
}

interface SavingsGoalAttributes {
  id: string;
  bankAccountId: string;       // where the money is being saved
  name: string;
  description?: string | null;
  targetAmount: number;
  currentAmount: number;       // how much has been saved so far
  deadline?: Date | null;
  status: GoalStatus;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type SavingsGoalCreationAttributes = Optional<
  SavingsGoalAttributes,
  "id" | "createdAt" | "updatedAt" | "description" | "deadline" | "notes" | "currentAmount" | "status"
>;

export default (sequelize: Sequelize) => {
  class SavingsGoal
    extends Model<SavingsGoalAttributes, SavingsGoalCreationAttributes>
    implements SavingsGoalAttributes
  {
    public id!: string;
    public bankAccountId!: string;
    public name!: string;
    public description!: string | null;
    public targetAmount!: number;
    public currentAmount!: number;
    public deadline!: Date | null;
    public status!: GoalStatus;
    public notes!: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  SavingsGoal.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bankAccountId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "bank_accounts", key: "id" },
        onDelete: "CASCADE",
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      targetAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currentAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      deadline: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.ENUM(...Object.values(GoalStatus)),
        allowNull: false,
        defaultValue: GoalStatus.ACTIVE,
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      tableName: "savings_goals",
      timestamps: true,
      indexes: [
        { fields: ["bankAccountId"] },
        { fields: ["status"] },
        { fields: ["deadline"] },
      ],
    }
  );

  return SavingsGoal;
};