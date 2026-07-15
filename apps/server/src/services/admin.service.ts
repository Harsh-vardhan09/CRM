import { prisma } from "@repo/db";
import type { AccessLevel } from "@repo/db";
import bcrypt from "bcryptjs";
import type {
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CompanyResponse,
  CreateRoleRequest,
  RoleResponse,
  AssignPermissionRequest,
  CreateUserRequest,
  UserResponse,
  PaginationParams,
  PaginatedResponse,
} from "../types/admin.types.js";

class AdminService {
  async createCompany(data: CreateCompanyRequest): Promise<CompanyResponse> {
    const company = await prisma.company.create({
      data: {
        name: data.name,
        status: data.status || "active",
      },
    });

    return {
      id: company.id,
      name: company.name,
      status: company.status as "active" | "suspended",
      createdAt: new Date(),
      updatedAt: new Date(),
      userCount: 0,
      featureCount: 0,
    };
  }

  async listCompanies(
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<CompanyResponse>> {
    const offset = (page - 1) * limit;

    const [companies, total] = await prisma.$transaction([
      prisma.company.findMany({
        skip: offset,
        take: limit,
        orderBy: { id: "asc" },
        include: {
          _count: {
            select: {
              users: { where: { deletedAt: null } },
              features: true,
            },
          },
        },
      }),
      prisma.company.count(),
    ]);

    const data: CompanyResponse[] = companies.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status as "active" | "suspended",
      createdAt: new Date(),
      updatedAt: new Date(),
      userCount: c._count.users,
      featureCount: c._count.features,
    }));


    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCompany(id: number): Promise<CompanyResponse> {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: { where: { deletedAt: null } },
            features: true,
          },
        },
      },
    });

    if (!company) {
      throw new Error("Company not found");
    }

    return {
      id: company.id,
      name: company.name,
      status: company.status as "active" | "suspended",
      createdAt: new Date(),
      updatedAt: new Date(),
      userCount: company._count.users,
      featureCount: company._count.features,
    };
  }

  async updateCompany(
    id: number,
    data: UpdateCompanyRequest,
  ): Promise<CompanyResponse> {
    const updateData: any = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    const company = (await prisma.company.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            users: { where: { deletedAt: null } },
            features: true,
          },
        },
      },
    })) as any;

    return {
      id: company.id,
      name: company.name,
      status: company.status as "active" | "suspended",
      createdAt: new Date(),
      updatedAt: new Date(),
      userCount: company._count.users,
      featureCount: company._count.features,
    };
  }

  async assignFeatures(
    companyId: number,
    featureIds: number[],
  ): Promise<void> {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new Error("Company not found");
    }

    // Verify all feature IDs exist
    const featuresCount = await prisma.feature.count({
      where: { id: { in: featureIds } },
    });
    if (featuresCount !== featureIds.length) {
      throw new Error("One or more feature IDs are invalid");
    }

    await prisma.$transaction([
      prisma.companyFeature.deleteMany({ where: { companyId } }),
      prisma.companyFeature.createMany({
        data: featureIds.map((featureId) => ({ companyId, featureId })),
      }),
    ]);
  }

  async createRole(companyId: number, data: CreateRoleRequest): Promise<RoleResponse> {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new Error("Company not found");
    }

    const role = await prisma.role.create({
      data: {
        companyId,
        name: data.name,
      },
    });

    return {
      id: role.id,
      companyId: role.companyId,
      name: role.name,
      createdAt: new Date(),
    };
  }

  async listRoles(companyId: number): Promise<RoleResponse[]> {
    const roles = await prisma.role.findMany({
      where: { companyId },
      orderBy: { id: "asc" },
    });

    return roles.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      name: r.name,
      createdAt: new Date(),
    }));
  }

  async assignPermissionsToRole(
    roleId: number,
    data: AssignPermissionRequest,
  ): Promise<void> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { company: true },
    });
    if (!role) {
      throw new Error("Role not found");
    }

    // Verify that all features being assigned are enabled for this role's company
    const featureIds = data.permissions.map((p) => p.featureId);
    const companyFeaturesCount = await prisma.companyFeature.count({
      where: {
        companyId: role.companyId,
        featureId: { in: featureIds },
      },
    });

    if (companyFeaturesCount !== featureIds.length) {
      throw new Error(
        "One or more features are not assigned to this role's company",
      );
    }

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      prisma.rolePermission.createMany({
        data: data.permissions.map((p) => ({
          roleId,
          featureId: p.featureId,
          accessLevel: p.accessLevel,
        })),
      }),
    ]);
  }

  async createUser(
    companyId: number,
    data: CreateUserRequest,
  ): Promise<UserResponse> {
    const role = await prisma.role.findFirst({
      where: { id: data.roleId, companyId },
    });
    if (!role) {
      throw new Error("Role not found in this company");
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: data.email, deletedAt: null },
    });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const defaultPassword = data.password || "TempPassword123!";
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        companyId,
        roleId: data.roleId,
        status: "active",
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      companyId: user.companyId || 0,
      roleId: user.roleId,
      status: user.status as "active" | "pending" | "rejected",
      isOwner: user.isOwner,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async listUsers(
    companyId: number,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<UserResponse>> {
    const offset = (page - 1) * limit;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: { companyId, deletedAt: null },
        skip: offset,
        take: limit,
        orderBy: { id: "asc" },
      }),
      prisma.user.count({
        where: { companyId, deletedAt: null },
      }),
    ]);

    const data: UserResponse[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      avatar: u.avatar,
      companyId: u.companyId || 0,
      roleId: u.roleId,
      status: u.status as "active" | "pending" | "rejected",
      isOwner: u.isOwner,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserRole(
    userId: number,
    companyId: number,
    roleId: number,
  ): Promise<UserResponse> {
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId, deletedAt: null },
    });
    if (!user) {
      throw new Error("User not found in this company");
    }

    const role = await prisma.role.findFirst({
      where: { id: roleId, companyId },
    });
    if (!role) {
      throw new Error("Role not found in this company");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roleId },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      companyId: updatedUser.companyId || 0,
      roleId: updatedUser.roleId,
      status: updatedUser.status as "active" | "pending" | "rejected",
      isOwner: updatedUser.isOwner,
      lastLoginAt: updatedUser.lastLoginAt,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async deleteUser(userId: number, companyId: number): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId, deletedAt: null },
    });
    if (!user) {
      throw new Error("User not found in this company");
    }

    if (user.isOwner) {
      throw new Error("Cannot delete company owner");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  }
}

export const adminService = new AdminService();
