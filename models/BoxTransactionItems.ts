import { DataTypes, Model, Sequelize, Optional } from "sequelize";
import { Box } from "./Box";

export type BoxStateType = "sold" | "returned" | "lost";
export type Contenertype = "box" | "single";

export interface BoxTransactionItemsItemAttributes {
  id: string;
  boxTransactionId: string;
  boxId: string;
  type: Box["type"];
  conternertype: Contenertype;
  quantity: number;
  states: BoxStateType;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BoxTransactionItemsItemCreationAttributes = Optional<
  BoxTransactionItemsItemAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export class BoxTransactionItemsItem
  extends Model<BoxTransactionItemsItemAttributes, BoxTransactionItemsItemCreationAttributes>
  implements BoxTransactionItemsItemAttributes
  {
    public id!: string;
    public boxTransactionId!: string;
    public boxId!: string
    public type!: Box["type"];
    public conternertype!: Contenertype;
    public quantity!: number
    public states!: BoxStateType;
    public price!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

export default (sequelize: Sequelize) => {
  BoxTransactionItemsItem.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        boxTransactionId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "BoxTransactions",
                key: "id",
            },
            onDelete: "CASCADE"
        },
        boxId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "boxes",
                key: "id",
            },
            onDelete: "CASCADE"
        },
        type: {
            type: DataTypes.ENUM("Softdrink", "Beer", "Wine", "liquor", "other"),
            allowNull: false
        },
        conternertype: {
            type: DataTypes.ENUM("box", "single"),
            allowNull: false
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        states: {
            type: DataTypes.ENUM("sold", "returned", "lost"),
            allowNull: false
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        }
    },
    {
        sequelize,
        tableName: "BoxTransactionItems",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ["BoxTransactionId"],
            },
            {
                fields: ["boxId"],
            },
        ],
     }
  );
  return BoxTransactionItemsItem;
}