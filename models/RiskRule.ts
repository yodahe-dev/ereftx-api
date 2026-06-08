import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

export type RuleType = 'maxDailyLoss' | 'maxDrawdown' | 'maxTradeLoss' | 'maxDailyTrades' | 'blockedNews' | 'allowedSessions';
export type RuleEnforcement = 'hard' | 'soft';

interface RiskRuleAttributes {
  id: string;
  accountId: string;
  ruleType: RuleType;
  enforcement: RuleEnforcement;
  value: number;          // e.g., 5 for 5% max daily loss
  params: object | null;  // JSON for complex rules (e.g., { "newsEvents": ["NFP", "FOMC"], "blockMinutes": 30 })
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type RiskRuleCreationAttributes = Optional<
  RiskRuleAttributes,
  'id' | 'params' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export default (sequelize: Sequelize) => {
  class RiskRule
    extends Model<RiskRuleAttributes, RiskRuleCreationAttributes>
    implements RiskRuleAttributes
  {
    public id!: string;
    public accountId!: string;
    public ruleType!: RuleType;
    public enforcement!: RuleEnforcement;
    public value!: number;
    public params!: object | null;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  RiskRule.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      accountId: { type: DataTypes.UUID, allowNull: false, references: { model: 'trading_accounts', key: 'id' }, onDelete: 'CASCADE' },
      ruleType: { type: DataTypes.ENUM('maxDailyLoss', 'maxDrawdown', 'maxTradeLoss', 'maxDailyTrades', 'blockedNews', 'allowedSessions'), allowNull: false },
      enforcement: { type: DataTypes.ENUM('hard', 'soft'), allowNull: false, defaultValue: 'hard' },
      value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      params: { type: DataTypes.JSON, allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      tableName: 'risk_rules',
      timestamps: true,
      indexes: [{ fields: ['accountId', 'ruleType'] }],
    }
  );

  return RiskRule;
};