/** Lead Model */

import { DataTypes, Model, type Optional } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Organisation } from './Organisation.js';
import { User }         from './User.js';

export type LeadStatus   = 'contacted' | 'unreachable' | 'no_reply' | 'qualified' | 'lost';
export type LeadPriority = 'low' | 'medium' | 'high';

export interface LeadAttributes {
  id:               string;
  name:             string;
  email?:           string | null;
  phone?:           string | null;
  status:           LeadStatus;
  score:            number;
  priority:         LeadPriority;
  ownerId:          string;
  orgId:            string;
  companyId?:       string | null;
  notes?:           string | null;
  source?:          string | null;
  lastContactedAt?: Date | null;
  deletedAt?:       Date | null;
}

export interface LeadCreationAttributes
  extends Optional<
    LeadAttributes,
    | 'id'
    | 'email'
    | 'phone'
    | 'score'
    | 'priority'
    | 'companyId'
    | 'notes'
    | 'source'
    | 'lastContactedAt'
    | 'deletedAt'
  > {}

export class Lead
  extends Model<LeadAttributes, LeadCreationAttributes>
  implements LeadAttributes
{
  declare id:               string;
  declare name:             string;
  declare email:            string | null;
  declare phone:            string | null;
  declare status:           LeadStatus;
  declare score:            number;
  declare priority:         LeadPriority;
  declare ownerId:          string;
  declare orgId:            string;
  declare companyId:        string | null;
  declare notes:            string | null;
  declare source:           string | null;
  declare lastContactedAt:  Date | null;
  declare deletedAt:        Date | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public static scoreToPriority(score: number): LeadPriority {
    if (score >= 67) return 'high';
    if (score >= 34) return 'medium';
    return 'low';
  }

  public toSafeJSON() {
    return {
      id:              this.id,
      name:            this.name,
      status:          this.status,
      score:           this.score,
      priority:        this.priority,
      ownerId:         this.ownerId,
      orgId:           this.orgId,
      companyId:       this.companyId,
      source:          this.source,
      lastContactedAt: this.lastContactedAt,
      createdAt:       this.createdAt,
      updatedAt:       this.updatedAt,
    };
  }

  public toFullJSON() {
    return {
      ...this.toSafeJSON(),
      email: this.email,
      phone: this.phone,
      notes: this.notes,
    };
  }
}

Lead.init(
  {
    id: {
      type:         DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey:   true,
    },
    name: {
      type:      DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Lead name cannot be empty' },
        len:      { args: [1, 255], msg: 'Lead name must be 1–255 characters' },
      },
    },
    email: {
      type:      DataTypes.STRING(320),
      allowNull: true,
      validate: {
        isEmail: { msg: 'Must be a valid email address' },
      },
    },
    phone: {
      type:      DataTypes.STRING(30),
      allowNull: true,
      validate: {
        is: {
          args: /^[+\d\s\-().]{7,30}$/,
          msg: 'Must be a valid phone number (7–30 chars, digits / + / - / spaces)',
        },
      },
    },
    status: {
      type:         DataTypes.ENUM('contacted', 'unreachable', 'no_reply', 'qualified', 'lost'),
      allowNull:    false,
      defaultValue: 'no_reply',
    },
    score: {
      type:         DataTypes.INTEGER,
      allowNull:    false,
      defaultValue: 0,
      validate: {
        min: { args: [0],   msg: 'Score must be at least 0'  },
        max: { args: [100], msg: 'Score cannot exceed 100'   },
      },
    },
    priority: {
      type:         DataTypes.ENUM('low', 'medium', 'high'),
      allowNull:    false,
      defaultValue: 'low',
      comment:      'Derived from score via beforeSave hook — do not set directly.',
    },
    ownerId: {
      type:       DataTypes.UUID,
      allowNull:  false,
      references: { model: 'users', key: 'id' },
      comment:    'FK → User (sales_rep). Required — every lead must have an owner.',
    },
    orgId: {
      type:       DataTypes.UUID,
      allowNull:  false,
      references: { model: 'organisations', key: 'id' },
      comment:    'Tenant scope. ALWAYS include in WHERE clauses.',
    },
    companyId: {
      type:       DataTypes.UUID,
      allowNull:  true,
      references: { model: 'companies', key: 'id' },
      onDelete:   'SET NULL',
    },
    notes: {
      type:      DataTypes.TEXT,
      allowNull: true,
      comment:   'PII — gate access at controller level.',
    },
    source: {
      type:      DataTypes.STRING(100),
      allowNull: true,
      comment:   'Origin channel: manual | webhook | csv_import | linkedin | …',
    },
    lastContactedAt: {
      type:      DataTypes.DATE,
      allowNull: true,
    },
    deletedAt: {
      type:      DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName:  'Lead',
    tableName:  'leads',
    paranoid:   true,
    timestamps: true,
    indexes: [
      { fields: ['orgId', 'status']    },
      { fields: ['orgId', 'priority']  },
      { fields: ['orgId', 'ownerId']   },
      {
        unique: true,
        fields: ['orgId', 'email'],
        where:  { deletedAt: null },
        name:   'leads_email_org_unique',
      },
    ],
    hooks: {
      beforeSave: (lead: Lead) => {
        if (lead.isNewRecord || lead.changed('score')) {
          lead.priority = Lead.scoreToPriority(lead.score);
        }
      },
    },
  },
);

export function associateLead(): void {
  Lead.belongsTo(Organisation, { foreignKey: 'orgId',     as: 'organisation' });
  Lead.belongsTo(User,         { foreignKey: 'ownerId',   as: 'owner'        });
}
