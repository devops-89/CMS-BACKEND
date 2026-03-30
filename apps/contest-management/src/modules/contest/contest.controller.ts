import { Request, Response } from "express";
import { ContestService } from "./contest.service";

const service = new ContestService();

type ContestParams = { id: string };

export class ContestController {
  create = async (req: Request, res: Response) => {
    try {
      const data = await service.createContest(req.body);
      return res.status(201).json({ message: "Contest created", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  getAll = async (req: Request, res: Response) => {
    try {
      const { status, search } = req.query as Record<string, string>;
      const data = await service.getContests(status, search);
      return res.status(200).json({ message: "Contests fetched", data });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  getOverview = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.getContestOverview(req.params.id);
      return res.status(200).json({ message: "Contest overview fetched", data });
    } catch (e: any) {
      return res.status(e.statusCode || 404).json({ message: e.message });
    }
  };

  update = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.updateContest(req.params.id, req.body);
      return res.status(200).json({ message: "Contest updated", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  updateStatus = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.updateStatus(req.params.id, req.body.status);
      return res.status(200).json({ message: "Status updated", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  delete = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.deleteContest(req.params.id);
      return res.status(200).json(data);
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };
}