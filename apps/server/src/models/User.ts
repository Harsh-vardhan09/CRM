/** User Model */

import { DataTypes, Model, type Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sequelize } from '../config/db.js';
import { Organisation } from './Organisation.js';

export type UserRole = 'super_admin' | 'admin' | 'sales_rep';

export interface UserPermissions {
  can_view_leads:      boolean;
  can_edit_leads:      boolean;
  can_delete_leads:    boolean;
  can_export_data:     boolean;
  can_run_automations: boolean;
  can_invite_users:    boolean;
}

export interface UserAttributes {
  id:              string;
  email:           string;
  passwordHash:    string;
  name:            string;
  avatar?:         string | null;
  role:            UserRole;
  orgId?:          string | null;
  permissions:     UserPermissions;
  refreshToken?:     string | null;
  refreshTokenHash?: string | null;
  lastLoginAt?:    Date | null;
  deletedAt?:      Date | null;
}

export interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | 'id'
    | 'avatar'
    | 'orgId'
    | 'permissions'
    | 'refreshToken'
    | 'refreshTokenHash'
    | 'lastLoginAt'
    | 'deletedAt'
  > {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id:               string;
  declare email:            string;
  declare passwordHash:     string;
  declare name:             string;
  declare avatar:           string | null;
  declare role:             UserRole;
  declare orgId:            string | null;
  declare permissions:      UserPermissions;
  declare refreshToken:     string | null;
  declare refreshTokenHash: string | null;
  declare lastLoginAt:      Date | null;
  declare deletedAt:        Date | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public async comparePassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.passwordHash);
  }

  public hashRefreshToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  public verifyRefreshToken(rawToken: string): boolean {
    if (!this.refreshTokenHash) return false;
    const incoming = this.hashRefreshToken(rawToken);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(incoming,              'hex'),
        Buffer.from(this.refreshTokenHash, 'hex'),
      );
    } catch {
      return false;
    }
  }

  public async revokeRefreshToken(): Promise<void> {
    this.refreshToken     = null;
    this.refreshTokenHash = null;
    await this.save();
  }

  public hasPerm(key: keyof UserPermissions): boolean {
    return Boolean(this.permissions?.[key]);
  }

  public toSafeJSON() {
    return {
      id:          this.id,
      email:       this.email,
      name:        this.name,
      avatar:      this.avatar,
      role:        this.role,
      orgId:       this.orgId,
      permissions: this.permissions,
      lastLoginAt: this.lastLoginAt,
      createdAt:   this.createdAt,
      updatedAt:   this.updatedAt,
    };
  }

  public static defaultPermissions(role: UserRole): UserPermissions {
    const none: UserPermissions = {
      can_view_leads:      false,
      can_edit_leads:      false,
      can_delete_leads:    false,
      can_export_data:     false,
      can_run_automations: false,
      can_invite_users:    false,
    };

    switch (role) {
      case 'super_admin':
        return {
          can_view_leads:      true,
          can_edit_leads:      true,
          can_delete_leads:    true,
          can_export_data:     true,
          can_run_automations: true,
          can_invite_users:    true,
        };

      case 'admin':
        return {
          can_view_leads:      true,
          can_edit_leads:      true,
          can_delete_leads:    true,
          can_export_data:     true,
          can_run_automations: true,
          can_invite_users:    true,
        };

      case 'sales_rep':
        return { ...none, can_view_leads: true, can_edit_leads: true };
    }
  }
}

User.init(
  {
    id: {
      type:         DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey:   true,
    },
    email: {
      type:      DataTypes.STRING(320),
      allowNull: false,
      validate: {
        isEmail:  { msg: 'Must be a valid email address' },
        notEmpty: { msg: 'Email cannot be empty' },
      },
    },
    passwordHash: {
      type:      DataTypes.STRING(72),
      allowNull: false,
      validate: { notEmpty: { msg: 'Password hash cannot be empty' } },
    },
    name: {
      type:      DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name cannot be empty' },
        len:      { args: [1, 255], msg: 'Name must be 1–255 characters' },
      },
    },
    avatar: {
      type:      DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: { msg: 'Avatar must be a valid URL' },
      },
    },
    role: {
      type:         DataTypes.ENUM('super_admin', 'admin', 'sales_rep'),
      allowNull:    false,
      defaultValue: 'sales_rep',
    },
    orgId: {
      type:       DataTypes.UUID,
      allowNull:  true,
      references: { model: 'organisations', key: 'id' },
      onDelete:   'SET NULL',
    },
    permissions: {
      type:         DataTypes.JSON,
      allowNull:    false,
      defaultValue: User.defaultPermissions('sales_rep'),
    },
    refreshToken: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },
    refreshTokenHash: {
      type:      DataTypes.CHAR(64),
      allowNull: true,
    },
    lastLoginAt: {
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
    modelName:  'User',
    tableName:  'users',
    paranoid:   true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ['email'],        where: { deletedAt: null } },
      { fields: ['orgId', 'role'] },
      { fields: ['orgId'] },
    ],
    hooks: {
      beforeSave: async (user: User) => {
        if (user.isNewRecord || user.changed('passwordHash')) {
          const alreadyHashed =
            typeof user.passwordHash === 'string' &&
            user.passwordHash.startsWith('$2') &&
            user.passwordHash.length >= 59;

          if (!alreadyHashed) {
            const salt = await bcrypt.genSalt(12);
            user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
          }
        }
      },
      beforeCreate: (user: User) => {
        const allFalse =
          user.permissions &&
          !Object.values(user.permissions).some(Boolean);

        if (!user.permissions || allFalse) {
          user.permissions = User.defaultPermissions(user.role);
        }
      },
    },
  },
);

User.belongsTo(Organisation, { foreignKey: 'orgId', as: 'organisation' });
Organisation.hasMany(User,   { foreignKey: 'orgId', as: 'users'        });

export function associateUser(): void {
}
