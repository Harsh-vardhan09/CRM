import type { Request } from "express";
import type { AccessLevel } from "@repo/db";

export interface ClientRequest extends Request {
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

export interface CreateClientRequest {
  accountId?: string;
  name: string;
  industry?: string;
  website?: string;
  revenue?: number | string | null;
  employeeCount?: number | null;
  address?: string | null;
  description?: string | null;
  ownerId?: number | null;
}

export interface UpdateClientRequest {
  name?: string;
  industry?: string | null;
  website?: string | null;
  revenue?: number | string | null;
  employeeCount?: number | null;
  address?: string | null;
  description?: string | null;
  ownerId?: number | null;
}

export interface ClientResponse {
  id: number;
  accountId: string;
  name: string;
  industry: string | null;
  website: string | null;
  revenue: string | null;
  employeeCount: number | null;
  address: string | null;
  description: string | null;
  companyId: number;
  ownerId: number | null;
  createdAt: Date;
  updatedAt: Date;
}
