import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/db.js';
import { Organisation } from './Organisation.js';

export interface UserPermissions {
  can_view_leads: boolean;
  can_edit_leads: boolean;
  can_delete_leads: boolean;
  can_export_data: boolean;
  can_run_automations: boolean;
  can_invite_users: boolean;
}

export interface UserAttributes {
  id?: string;
  email: string;
  passwordHash: string;
  name: string;
  avatar?: string;
  role: 'super_admin' | 'admin' | 'sales_rep';
  orgId?: string;
  permissions: UserPermissions;
  refreshToken?: string | null;
  lastLoginAt?: Date;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  declare public id: string;
  declare public email: string;
  declare public passwordHash: string;
  declare public name: string;
  declare public avatar?: string;
  declare public role: 'super_admin' | 'admin' | 'sales_rep';
  declare public orgId?: string;
  declare public permissions: UserPermissions;
  declare public refreshToken?: string | null;
  declare public lastLoginAt?: Date;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'admin', 'sales_rep'),
      allowNull: false,
      defaultValue: 'sales_rep',
    },
    orgId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organisations',
        key: 'id',
      },
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        can_view_leads: true,
        can_edit_leads: false,
        can_delete_leads: false,
        can_export_data: false,
        can_run_automations: false,
        can_invite_users: false,
      },
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      beforeSave: async (user: User) => {
        if (user.isNewRecord || user.changed('passwordHash')) {
          const salt = await bcrypt.genSalt(10);
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      },
    },
  }
);

// Define associations
User.belongsTo(Organisation, { foreignKey: 'orgId', as: 'organisation' });
Organisation.hasMany(User, { foreignKey: 'orgId', as: 'users' });
