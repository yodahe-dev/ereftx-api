import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export type BoxType = "Softdrink" | "Beer" | "Wine" | "liquor" | "other";
interface BoxAttributes {
    id: string;
    catagroryId: string;
    type: BoxType;
    boxbuyingPrice: number;
    boxSellingPrice: number;
    boxQuantity: number;
    boxCurentPrice: number;
    boxCurrentQuantity: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

export type BoxCreationAttributes = Optional<BoxAttributes, "id" | "createdAt" | "updatedAt" | "deletedAt">;

export class Box extends Model<BoxAttributes, BoxCreationAttributes> implements BoxAttributes
{
    public id!: string;
    public catagroryId!: string;
    public type!: BoxType;
    public boxbuyingPrice!: number;
    public boxSellingPrice!: number
    public boxQuantity!: number;
    public boxCurentPrice!: number
    public boxCurrentQuantity!: number;
    public readonly createdAt!: Date
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date | null;
}

export default (sequelize: Sequelize) => {
    Box.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },

            catagroryId: {
                type: DataTypes.UUID,
                allowNull: true,
                references : {
                    model: "categories",
                    key: "id",
                },
                onDelete: "CASCADE"
            },
            type: {
                type: DataTypes.ENUM("Softdrink", "Beer", "Wine", "liquor", "other"),
                allowNull: false
            },
            boxbuyingPrice: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },
            boxSellingPrice: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },
            boxQuantity: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            boxCurentPrice: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },
            boxCurrentQuantity: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        },
        {
            sequelize,
            tableName: "boxes",
            timestamps: true,
            paranoid: true,
            indexes: [
                {
                    fields: ["catagroryId"],
                }
            ]
        }

    );

    return Box;
}