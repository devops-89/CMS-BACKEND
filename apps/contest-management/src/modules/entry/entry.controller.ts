import { Request, Response } from "express";
import { AuthRequest } from "@libs/middlewares/auth.middleware";
import { EntryService } from "./entry.service";

const service = new EntryService();

type ContestParams = { contestId: string };
type EntryParams = { contestId: string; eid: string };

export class EntryController {
  constructor() {
    console.log("[Cron Job] Entry auto-approve scheduler initialized to run every 2 minutes.");
    setInterval(async () => {
      try {
        console.log(`[Cron Job] Running auto-approve check at: ${new Date().toISOString()}`);
        await service.autoApproveEntries();
      } catch (err: any) {
        console.error("[Cron Job] Error in auto-approve cron:", err.message);
      }
    }, 2 * 60 * 1000);
  }

  create = async (req: AuthRequest<ContestParams>, res: Response) => {
    try {
      const data = await service.createEntry(
        req.params.contestId,
        req.body,
        req.files as Express.Multer.File[],
        req.user?.userId,
        req.user?.role
      );
      return res.status(201).json({ message: "Entry created", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  getAll = async (req: AuthRequest<ContestParams>, res: Response) => {
    try {
      const { status, page, limit } = req.query as Record<string, string>;
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;
      const data = await service.getEntries(
        req.params.contestId,
        req.user?.userId,
        req.user?.role,
        status,
        pageNum,
        limitNum
      );
      return res.status(200).json({ message: "Entries fetched", data });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  getOne = async (req: AuthRequest<EntryParams>, res: Response) => {
    try {
      const data = await service.getEntryById(
        req.params.eid,
        req.params.contestId,
        req.user?.userId,
        req.user?.role
      );
      return res.status(200).json({ message: "Entry fetched", data });
    } catch (e: any) {
      return res.status(e.statusCode || 404).json({ message: e.message });
    }
  };

  updateStatus = async (req: Request<EntryParams>, res: Response) => {
    try {
      const data = await service.updateStatus(
        req.params.eid,
        req.params.contestId,
        req.body.status
      );
      return res.status(200).json({ message: "Entry status updated", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  update = async (req: AuthRequest<EntryParams>, res: Response) => {
    try {
      const data = await service.updateEntry(
        req.params.eid,
        req.params.contestId,
        req.body,
        req.files as Express.Multer.File[],
        req.user?.userId,
        req.user?.role
      );
      return res.status(200).json({ message: "Entry updated", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  delete = async (req: Request<EntryParams>, res: Response) => {
    try {
      const data = await service.deleteEntry(req.params.eid, req.params.contestId);
      return res.status(200).json(data);
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  triggerAutoApproveCron = async (req: Request, res: Response) => {
    try {
      const { updatedCount, contestsProcessed } = await service.autoApproveEntries();
      return res.status(200).json({
        message: "Auto-approve cron executed successfully",
        contestsProcessed,
        updatedCount,
      });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };
}