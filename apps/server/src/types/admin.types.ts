import type { Request } from "express";
import type { AccessLevel } from "@repo/db";

export interface AdminRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    avatar: string | null;
    companyId: number | null;
    roleId: number | null;
    roleName: string | null;
    status: string;
    isOwner: boolean;
    isSuperAdmin: boolean;
    permissions: Record<string, AccessLevel>;
  };
}

export interface CreateCompanyRequest {
  name: string;
  status?: "active" | "suspended";
}

export interface UpdateCompanyRequest {
  name?: string;
  status?: "active" | "suspended";
}

export interface CompanyResponse {
  id: number;
  name: string;
  status: "active" | "suspended";
  createdAt: Date;
  updatedAt: Date;
  userCount?: number;
  featureCount?: number;
}

export interface CreateRoleRequest {
  name: string;
}

export interface RoleResponse {
  id: number;
  companyId: number;
  name: string;
  createdAt?: Date;
}

export interface AssignPermissionRequest {
  permissions: Array<{
    featureId: number;
    accessLevel: AccessLevel;
  }>;
}

export interface PermissionResponse {
  roleId: number;
  featureId: number;
  accessLevel: AccessLevel;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password?: string;
  roleId: number;
}

export interface UpdateUserRoleRequest {
  roleId: number;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  companyId: number | null;
  roleId: number | null;
  status: "active" | "pending" | "rejected";
  isOwner: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
