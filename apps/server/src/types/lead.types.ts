import type { LeadStatus, LeadPriority, LeadChannel } from "@repo/db";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export type LeadRequest = AuthenticatedRequest;

export interface CreateLeadData {
  name: string;
  email?: string | null;
  phone?: string | null;
  status?: LeadStatus;
  priority?: LeadPriority;
  score?: number;
  notes?: string | null;
  source?: string | null;
  clientId?: number | null;
  ownerId?: number | null;
  originChannel?: LeadChannel | null;
}

export interface UpdateLeadData {
  name?: string;
  email?: string | null;
  phone?: string | null;
  status?: LeadStatus;
  priority?: LeadPriority;
  score?: number;
  notes?: string | null;
  source?: string | null;
  clientId?: number | null;
  ownerId?: number | null;
  isActive?: boolean;
  optedOut?: boolean;
  lastChannel?: LeadChannel | null;
}

export interface SendLeadMessageData {
  channel: LeadChannel;
  body: string;
  subject?: string;
}
