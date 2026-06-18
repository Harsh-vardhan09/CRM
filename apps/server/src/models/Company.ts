/** Company Model */

import { DataTypes, Model, type Optional } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Organisation } from './Organisation.js';
import { User }         from './User.js';

export interface CompanyAttributes {
  id:              string;
  accountId:       string;
  name:            string;
  industry?:       string | null;
  website?:        string | null;
  revenue?:        number | null;
  employeeCount?:  number | null;
  address?:        string | null;
  description?:    string | null;
  ownerId?:        string | null;
  orgId:           string;
  deletedAt?:      Date | null;
}

export interface CompanyCreationAttributes
  extends Optional<
    CompanyAttributes,
    | 'id'
    | 'accountId'
    | 'industry'
    | 'website'
    | 'revenue'
    | 'employeeCount'
    | 'address'
    | 'description'
    | 'ownerId'
    | 'deletedAt'
  > {}

export class Company
  extends Model<CompanyAttributes, CompanyCreationAttributes>
  implements CompanyAttributes
{
  declare id:             string;
  declare accountId:      string;
  declare name:           string;
  declare industry:       string | null;
  declare website:        string | null;
  declare revenue:        number | null;
  declare employeeCount:  number | null;
  declare address:        string | null;
  declare description:    string | null;
  declare ownerId:        string | null;
  declare orgId:          string;
  declare deletedAt:      Date | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public toSafeJSON() {
    return {
      id:            this.id,
      accountId:     this.accountId,
      name:          this.name,
      industry:      this.industry,
      website:       this.website,
      employeeCount: this.employeeCount,
      ownerId:       this.ownerId,
      orgId:         this.orgId,
      createdAt:     this.createdAt,
      updatedAt:     this.updatedAt,
    };
  }

  public toFullJSON() {
    return {
      ...this.toSafeJSON(),
      revenue:     this.revenue,
      address:     this.address,
      description: this.description,
    };
  }
}

Company.init(
  {
    id: {
      type:         DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey:   true,
    },
    accountId: {
      type:      DataTypes.STRING(50),
      allowNull: false,
      comment:   'Human-readable ID e.g. ACC-M2K9FP. Auto-generated if omitted.',
    },
    name: {
      type:      DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Company name cannot be empty' },
        len:      { args: [1, 255], msg: 'Company name must be 1–255 characters' },
      },
    },
    industry: {
      type:      DataTypes.STRING(100),
      allowNull: true,
      comment:   'e.g. SaaS, Healthcare, Finance, Retail, Manufacturing',
    },
    website: {
      type:      DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: { msg: 'Website must be a valid URL' },
      },
    },
    revenue: {
      type:      DataTypes.DECIMAL(18, 2),
      allowNull: true,
      validate: {
        min: { args: [0], msg: 'Revenue cannot be negative' },
      },
      comment: 'Annual revenue in USD. Sensitive — gate at controller level.',
    },
    employeeCount: {
      type:      DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: [0], msg: 'Employee count cannot be negative' },
      },
    },
    address: {
      type:      DataTypes.STRING(500),
      allowNull: true,
      comment:   'Free-form city / country / full address.',
    },
    description: {
      type:      DataTypes.TEXT,
      allowNull: true,
      comment:   'Internal notes — gate at controller level.',
    },
    ownerId: {
      type:       DataTypes.UUID,
      allowNull:  true,
      references: { model: 'users', key: 'id' },
      onDelete:   'SET NULL',
    },
    orgId: {
      type:       DataTypes.UUID,
      allowNull:  false,
      references: { model: 'organisations', key: 'id' },
      comment:    'Tenant scope. ALWAYS include in WHERE clauses.',
    },
    deletedAt: {
      type:      DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName:  'Company',
    tableName:  'companies',
    paranoid:   true,
    timestamps: true,
    indexes: [
      { fields: ['orgId', 'name']     },
      { fields: ['orgId', 'industry'] },
      {
        unique: true,
        fields: ['orgId', 'accountId'],
        where:  { deletedAt: null },
        name:   'companies_account_id_org_unique',
      },
      {
        unique: true,
        fields: ['orgId', 'name'],
        where:  { deletedAt: null },
        name:   'companies_name_org_unique',
      },
    ],
    hooks: {
      beforeCreate: (company: Company) => {
        if (!company.accountId) {
          const suffix      = Date.now().toString(36).toUpperCase().slice(-6);
          company.accountId = `ACC-${suffix}`;
        }
      },
    },
  },
);

export function associateCompany(): void {
  Company.belongsTo(Organisation, { foreignKey: 'orgId',   as: 'organisation' });
  Company.belongsTo(User,         { foreignKey: 'ownerId', as: 'owner'        });
}
