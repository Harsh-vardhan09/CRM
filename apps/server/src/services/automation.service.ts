import { prisma } from "@repo/db";

export interface AutomationActionConfig {
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  template: string;
}

export interface CreateAutomationData {
  name: string;
  trigger: "LEAD_INACTIVE";
  action: "SEND_MESSAGE";
  actionConfig: AutomationActionConfig;
  enabled?: boolean;
}

export interface UpdateAutomationData {
  name?: string;
  actionConfig?: AutomationActionConfig;
  enabled?: boolean;
}

class AutomationService {
  async listAutomations(companyId: number) {
    return (prisma as any).automation.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAutomation(companyId: number, id: number) {
    return (prisma as any).automation.findFirst({ where: { id, companyId } });
  }

  async createAutomation(companyId: number, data: CreateAutomationData) {
    return (prisma as any).automation.create({
      data: {
        companyId,
        name: data.name,
        trigger: data.trigger,
        action: data.action,
        actionConfig: data.actionConfig,
        enabled: data.enabled ?? true,
      },
    });
  }

  async updateAutomation(companyId: number, id: number, data: UpdateAutomationData) {
    const existing = await (prisma as any).automation.findFirst({ where: { id, companyId } });
    if (!existing) return null;
    return (prisma as any).automation.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.actionConfig !== undefined && { actionConfig: data.actionConfig }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
      },
    });
  }

  async deleteAutomation(companyId: number, id: number) {
    const existing = await (prisma as any).automation.findFirst({ where: { id, companyId } });
    if (!existing) return false;
    await (prisma as any).automation.delete({ where: { id } });
    return true;
  }
}

export const automationService = new AutomationService();
