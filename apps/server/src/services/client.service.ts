import { prisma } from "@repo/db";
import type {
  CreateClientRequest,
  UpdateClientRequest,
  ClientResponse,
} from "../types/client.types.js";

const ACCOUNT_ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateAccountId(): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += ACCOUNT_ID_CHARS.charAt(Math.floor(Math.random() * ACCOUNT_ID_CHARS.length));
  }
  return `ACC-${suffix}`;
}

function toClientResponse(c: any): ClientResponse {
  return {
    id: c.id,
    accountId: c.accountId,
    name: c.name,
    industry: c.industry ?? null,
    website: c.website ?? null,
    revenue: c.revenue != null ? c.revenue.toString() : null,
    employeeCount: c.employeeCount ?? null,
    address: c.address ?? null,
    description: c.description ?? null,
    companyId: c.companyId,
    ownerId: c.ownerId ?? null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

class ClientService {
  async createClient(
    companyId: number,
    data: CreateClientRequest,
    requesterId: number,
  ): Promise<ClientResponse> {
    let accountId = data.accountId;
    if (!accountId) {
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = generateAccountId();
        const existing = await prisma.client.findUnique({
          where: { companyId_accountId: { companyId, accountId: candidate } },
        });
        if (!existing) {
          accountId = candidate;
          break;
        }
      }
      if (!accountId) throw new Error("Failed to generate a unique account ID");
    }

    const client = await prisma.client.create({
      data: {
        accountId,
        name: data.name,
        industry: data.industry ?? null,
        website: data.website ?? null,
        revenue: data.revenue != null ? String(data.revenue) : null,
        employeeCount: data.employeeCount ?? null,
        address: data.address ?? null,
        description: data.description ?? null,
        companyId,
        ownerId: data.ownerId ?? requesterId,
      },
    });

    return toClientResponse(client);
  }

  async listClients(
    companyId: number,
    page: number,
    limit: number,
    industry?: string,
  ): Promise<{ data: ClientResponse[]; pagination: any }> {
    const offset = (page - 1) * limit;
    const where: any = { companyId, deletedAt: null };
    if (industry) where.industry = industry;

    const [clients, total] = await prisma.$transaction([
      prisma.client.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.client.count({ where }),
    ]);

    return {
      data: clients.map(toClientResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getClient(id: number, companyId: number): Promise<ClientResponse> {
    const client = await prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!client) throw new Error("Client not found");
    return toClientResponse(client);
  }

  async updateClient(
    id: number,
    companyId: number,
    data: UpdateClientRequest,
  ): Promise<ClientResponse> {
    const existing = await prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) throw new Error("Client not found");

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.revenue !== undefined)
      updateData.revenue = data.revenue != null ? String(data.revenue) : null;
    if (data.employeeCount !== undefined) updateData.employeeCount = data.employeeCount;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.ownerId !== undefined) updateData.ownerId = data.ownerId;

    const client = await prisma.client.update({ where: { id }, data: updateData });
    return toClientResponse(client);
  }

  // Soft delete — mirrors deleteUser in admin.service.ts
  async deleteClient(id: number, companyId: number): Promise<void> {
    const existing = await prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) throw new Error("Client not found");

    await prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const clientService = new ClientService();
