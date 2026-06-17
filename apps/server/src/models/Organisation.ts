import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface OrganisationAttributes {
  id?: string;
  name: string;
  industry?: string;
  website?: string;
  revenue?: number;
  employeeCount?: number;
}

export class Organisation extends Model<OrganisationAttributes> implements OrganisationAttributes {
  declare public id: string;
  declare public name: string;
  declare public industry?: string;
  declare public website?: string;
  declare public revenue?: number;
  declare public employeeCount?: number;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Organisation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    revenue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    employeeCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Organisation',
    tableName: 'organisations',
  }
);
