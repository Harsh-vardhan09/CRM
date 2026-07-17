import type { Request, Response } from "express";
import { automationService } from "../services/automation.service.js";

class AutomationController {
  listAutomations = async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return res.status(403).json({ error: "No organization." });
      const automations = await automationService.listAutomations(companyId);
      return res.json({ data: automations });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  getAutomation = async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return res.status(403).json({ error: "No organization." });
      const automation = await automationService.getAutomation(companyId, parseInt(req.params['id'] as string));
      if (!automation) return res.status(404).json({ error: "Automation not found." });
      return res.json({ data: automation });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  createAutomation = async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return res.status(403).json({ error: "No organization." });
      const { name, actionConfig } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "Name is required." });
      if (!actionConfig?.channel || !actionConfig?.template?.trim()) {
        return res.status(400).json({ error: "actionConfig.channel and actionConfig.template are required." });
      }
      const automation = await automationService.createAutomation(companyId, {
        name,
        trigger: "LEAD_INACTIVE",
        action: "SEND_MESSAGE",
        actionConfig,
        enabled: req.body.enabled ?? true,
      });
      return res.status(201).json({ data: automation });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  };

  updateAutomation = async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return res.status(403).json({ error: "No organization." });
      const automation = await automationService.updateAutomation(
        companyId,
        parseInt(req.params['id'] as string),
        req.body,
      );
      if (!automation) return res.status(404).json({ error: "Automation not found." });
      return res.json({ data: automation });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  };

  deleteAutomation = async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return res.status(403).json({ error: "No organization." });
      const ok = await automationService.deleteAutomation(companyId, parseInt(req.params['id'] as string));
      if (!ok) return res.status(404).json({ error: "Automation not found." });
      return res.status(204).send();
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };
}

export const automationController = new AutomationController();
