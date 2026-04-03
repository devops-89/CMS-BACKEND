import { Request, Response } from "express";
import { ContestJudgeService } from "./judge.service";

const service = new ContestJudgeService();

type ContestParams = { contestId: string };
type JudgeParams = { contestId: string; jid: string };

export class ContestJudgeController {
  assign = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.assignJudge(req.params.contestId, req.body);
      return res.status(201).json({ message: "Judge assigned to contest", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  getAll = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.getJudges(req.params.contestId);
      return res.status(200).json({ message: "Judges fetched", data });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  updateStatus = async (req: Request<JudgeParams>, res: Response) => {
    try {
      const data = await service.updateStatus(req.params.jid, req.body.status);
      return res.status(200).json({ message: "Judge status updated", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  remove = async (req: Request<JudgeParams>, res: Response) => {
    try {
      const data = await service.removeJudge(req.params.jid);
      return res.status(200).json(data);
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };
}