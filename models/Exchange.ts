import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export type ExchangeType = "box" | "single";

interface ExchangeAttributes {
  id: string;
  
  // Products involved
  sourceProductId: string;
  targetProductId: string;

  // Prices at the time of exchange (Financial Snapshot)
  sourcePriceId: string;
  targetPriceId: string;

  // Quantities
  sourceQuantity: number;
  targetQuantity: number;
  
  exchangeType: ExchangeType;
  
  // Financial difference (e.g., if one is more expensive than the other)
  balanceAmount: number; 
  
  notes?: string | null;
  createdAt?: Date;
}

type ExchangeCreationAttributes = Optional<
  ExchangeAttributes, 
  "id" | "notes" | "createdAt" | "balanceAmount"
>;

export default (sequelize: Sequelize) => {
  class Exchange 
    extends Model<ExchangeAttributes, ExchangeCreationAttributes> 
    implements ExchangeAttributes 
  {
    public id!: string;
    public sourceProductId!: string;
    public targetProductId!: string;
    public sourcePriceId!: string;
    public targetPriceId!: string;
    public sourceQuantity!: number;
    public targetQuantity!: number;
    public exchangeType!: ExchangeType;
    public balanceAmount!: number;
    public notes!: string | null;
    public readonly createdAt!: Date;
  }

  Exchange.init(
    {
      id: { 
        type: DataTypes.UUID, 
        defaultValue: DataTypes.UUIDV4, 
        primaryKey: true 
      },
      sourceProductId: { 
        type: DataTypes.UUID, 
        allowNull: false,
        references: { model: "products", key: "id" }
      },
      targetProductId: { 
        type: DataTypes.UUID, 
        allowNull: false, 
        references: { model: "products", key: "id" }
      },
      sourcePriceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "product_prices", key: "id" }
      },
      targetPriceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "product_prices", key: "id" }
      },
      sourceQuantity: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        validate: { min: 1 } // You can't exchange 0 items
      },
      targetQuantity: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        validate: { min: 1 } 
      },
      exchangeType: { 
        type: DataTypes.ENUM("box", "single"), 
        allowNull: false 
      },
      balanceAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Financial difference between source and target total value",
        get() {
          return Number(this.getDataValue("balanceAmount"));
        }
      },
      notes: { 
        type: DataTypes.TEXT, 
        allowNull: true 
      },
    },
    { 
      sequelize, 
      tableName: "exchanges", 
      timestamps: true, 
      updatedAt: false // Exchanges are immutable logs
    }
  );

  return Exchange;
};