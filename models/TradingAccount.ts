import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

export type AccountType = 'live' | 'demo' | 'prop';
export type PropFirm = 'FTMO' | 'MyForexFunds' | 'TheFundedTrader' | 'Other';

interface TradingAccountAttributes {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  propFirm?: PropFirm | null;
  initialBalance: number;
  currentBalance: number;
  maxDailyLoss: number;         // in balance %
  maxDrawdown: number;          // trailing or absolute %
  maxTradeLoss: number;         // per trade %
  leverage: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

type TradingAccountCreationAttributes = Optional<
  TradingAccountAttributes,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'propFirm'
>;

export default (sequelize: Sequelize) => {
  class TradingAccount
    extends Model<TradingAccountAttributes, TradingAccountCreationAttributes>
    implements TradingAccountAttributes
  {
    public id!: string;
    public userId!: string;
    public name!: string;
    public type!: AccountType;
    public propFirm!: PropFirm | null;
    public initialBalance!: number;
    public currentBalance!: number;
    public maxDailyLoss!: number;
    public maxDrawdown!: number;
    public maxTradeLoss!: number;
    public leverage!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date | null;
  }

  TradingAccount.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('live', 'demo', 'prop'),
        allowNull: false,
      },
      propFirm: {
        type: DataTypes.ENUM('FTMO', 'MyForexFunds', 'TheFundedTrader', 'Other'),
        allowNull: true,
      },
      initialBalance: {
        type: DataTypes.DECIMAL(18, 4),
        allowNull: false,
        validate: { min: 0 },
        get() {
          return Number(this.getDataValue('initialBalance'));
        },
      },
      currentBalance: {
        type: DataTypes.DECIMAL(18, 4),
        allowNull: false,
        get() {
          return Number(this.getDataValue('currentBalance'));
        },
      },
      maxDailyLoss: {
        type: DataTypes.DECIMAL(5, 5),
        allowNull: false,
        defaultValue: 5.0,
      },
      maxDrawdown: {
        type: DataTypes.DECIMAL(5, 5),
        allowNull: false,
        defaultValue: 10.0,
      },
      maxTradeLoss: {
        type: DataTypes.DECIMAL(5, 5),
        allowNull: false,
        defaultValue: 2.0,
      },
      leverage: {
        type: DataTypes.DECIMAL(5, 5),
        allowNull: false,
        defaultValue: 30,
      },
    },
    {
      sequelize,
      tableName: 'trading_accounts',
      timestamps: true,
      paranoid: true,
      indexes: [{ fields: ['userId'] }, { fields: ['type'] }],
    }
  );

  return TradingAccount;
};