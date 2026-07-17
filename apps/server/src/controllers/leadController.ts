import type { Response } from "express";
import { leadService } from "../services/lead.service.js";
import type { LeadRequest } from "../types/lead.types.js";

class LeadController {
  createLead = async (req: LeadRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) return res.status(403).json({ error: "No organization." });
      const lead = await leadService.createLead(companyId, req.user!.id, req.body);
      return res.status(201).json({ data: lead });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  };

  listLeads = async (req: LeadRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) return res.status(403).json({ error: "No organization." });

      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const status = req.query.status as any;
      const isActiveRaw = req.query.isActive as string | undefined;
      const isActive = isActiveRaw !== undefined ? isActiveRaw === "true" : undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const opts: Parameters<typeof leadService.listLeads>[1] = { page, limit };
      if (clientId !== undefined) opts.clientId = clientId;
      if (status !== undefined) opts.status = status;
      if (isActive !== undefined) opts.isActive = isActive;
      const result = await leadService.listLeads(companyId, opts);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  getLead = async (req: LeadRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) return res.status(403).json({ error: "No organization." });
      const lead = await leadService.getLead(companyId, parseInt(req.params['id'] as string));
      if (!lead) return res.status(404).json({ error: "Lead not found." });
      return res.json({ data: lead });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  updateLead = async (req: LeadRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) return res.status(403).json({ error: "No organization." });
      const lead = await leadService.updateLead(companyId, parseInt(req.params['id'] as string), req.body);
      if (!lead) return res.status(404).json({ error: "Lead not found." });
      return res.json({ data: lead });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  };

  deleteLead = async (req: LeadRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) return res.status(403).json({ error: "No organization." });
      const ok = await leadService.deleteLead(companyId, parseInt(req.params['id'] as string));
      if (!ok) return res.status(404).json({ error: "Lead not found." });
      return res.status(204).send();
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  getLeadMessages = async (req: LeadRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) return res.status(403).json({ error: "No organization." });
      const messages = await leadService.getLeadMessages(companyId, parseInt(req.params['id'] as string));
      if (messages === null) return res.status(404).json({ error: "Lead not found." });
      return res.json({ data: messages });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  sendLeadMessage = async (req: LeadRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) return res.status(403).json({ error: "No organization." });
      const message = await leadService.queueLeadMessage(
        companyId,
        parseInt(req.params['id'] as string),
        req.user!.id,
        req.body,
      );
      if (message === null) return res.status(404).json({ error: "Lead not found." });
      return res.status(201).json({ data: message });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  };
}

export const leadController = new LeadController();
