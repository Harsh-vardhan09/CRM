import type { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service.js";

class DashboardController {
  getStats = async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return res.status(403).json({ error: "No organization." });
      const stats = await dashboardService.getStats(companyId);
      return res.json({ data: stats });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  getPipeline = async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return res.status(403).json({ error: "No organization." });
      const pipeline = await dashboardService.getPipeline(companyId);
      return res.json({ data: pipeline });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };
}

export const dashboardController = new DashboardController();
