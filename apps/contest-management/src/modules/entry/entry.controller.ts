import { Request, Response } from "express";
import { EntryService } from "./entry.service";

const service = new EntryService();

type ContestParams = { contestId: string };
type EntryParams = { contestId: string; eid: string };

export class EntryController {
  create = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.createEntry(req.params.contestId, req.body);
      return res.status(201).json({ message: "Entry created", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  getAll = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.getEntries(req.params.contestId);
      return res.status(200).json({ message: "Entries fetched", data });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  getOne = async (req: Request<EntryParams>, res: Response) => {
    try {
      const data = await service.getEntryById(req.params.eid, req.params.contestId);
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

  update = async (req: Request<EntryParams>, res: Response) => {
  try {
    const data = await service.updateEntry(
      req.params.eid,
      req.params.contestId,
      req.body
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
}