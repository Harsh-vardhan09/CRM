import type { Response } from "express";
import { clientService } from "../services/client.service.js";
import type { ClientRequest } from "../types/client.types.js";

class ClientController {
  createClient = async (req: ClientRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        res.status(400).json({ success: false, error: "Bad Request", details: "Company context missing" });
        return;
      }
      const result = await clientService.createClient(companyId, req.body, req.user!.id);
      res.status(201).json({ success: true, message: "Client created successfully", data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: "Bad Request", details: error.message });
    }
  };

  listClients = async (req: ClientRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        res.status(400).json({ success: false, error: "Bad Request", details: "Company context missing" });
        return;
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const industry = (req.query.industry as string) || undefined;
      const result = await clientService.listClients(companyId, page, limit, industry);
      res.status(200).json({
        success: true,
        message: "Clients retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Internal Server Error", details: error.message });
    }
  };

  getClient = async (req: ClientRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        res.status(400).json({ success: false, error: "Bad Request", details: "Company context missing" });
        return;
      }
      const id = parseInt(req.params['id'] as string);
      const result = await clientService.getClient(id, companyId);
      res.status(200).json({ success: true, message: "Client retrieved successfully", data: result });
    } catch (error: any) {
      res.status(404).json({ success: false, error: "Not Found", details: error.message });
    }
  };

  updateClient = async (req: ClientRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        res.status(400).json({ success: false, error: "Bad Request", details: "Company context missing" });
        return;
      }
      const id = parseInt(req.params['id'] as string);
      const result = await clientService.updateClient(id, companyId, req.body);
      res.status(200).json({ success: true, message: "Client updated successfully", data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: "Bad Request", details: error.message });
    }
  };

  deleteClient = async (req: ClientRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        res.status(400).json({ success: false, error: "Bad Request", details: "Company context missing" });
        return;
      }
      const id = parseInt(req.params['id'] as string);
      await clientService.deleteClient(id, companyId);
      res.status(200).json({ success: true, message: "Client deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, error: "Bad Request", details: error.message });
    }
  };
}

export const clientController = new ClientController();
