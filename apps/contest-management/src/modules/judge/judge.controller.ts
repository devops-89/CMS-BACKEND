import { Request, Response } from "express";
import { ContestJudgeService } from "./judge.service";
import { AuthRequest } from "@libs/middlewares/auth.middleware";

const service = new ContestJudgeService();

type ContestParams = { contestId: string };
type JudgeParams = { contestId: string; jid: string };
type RemoveJudgeParams = { contestId: string; judgeId: string };

export class ContestJudgeController {
  assign = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.assignJudge(req.params.contestId, req.body);
      return res.status(201).json({ message: "Judge assigned to contest", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  editAssignments = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.editAssignments(req.params.contestId, req.body);
      return res.status(200).json({ message: "Judge assignments updated successfully", data });
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

  removeContestJudgesandAsigneeEntities = async (req: Request<RemoveJudgeParams>, res: Response) => {
    try {
      const data = await service.removeContestJudgeAndAssignments(req.params.contestId, req.params.judgeId);
      return res.status(200).json(data);
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  getMyEntries = async (req: Request, res: Response) => {
    try {
      const judgeId = (req as any).user.userId;
      const { page, limit } = req.query as Record<string, string>;
      const parsedPage = page ? parseInt(page, 10) : 1;
      const parsedLimit = limit ? parseInt(limit, 10) : 10;

      const data = await service.getJudgeAssignments(judgeId, parsedPage, parsedLimit);
      return res.status(200).json({ message: "Assignments fetched successfully", data });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  evaluateEntry = async (req: AuthRequest<{ entryId: string }>, res: Response) => {
    try {
      const judgeId = req.user!.userId;
      const { entryId } = req.params;
      const data = await service.evaluateEntry(judgeId, entryId, req.body);
      return res.status(200).json(data);
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  getEvaluation = async (req: AuthRequest<{ entryId: string }>, res: Response) => {
    try {
      const judgeId = req.user!.userId;
      const { entryId } = req.params;
      const data = await service.getEvaluation(judgeId, entryId);
      return res.status(200).json(data);
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  updateEvaluation = async (req: AuthRequest<{ entryId: string }>, res: Response) => {
    try {
      const judgeId = req.user!.userId;
      const { entryId } = req.params;
      const data = await service.updateEvaluation(judgeId, entryId, req.body);
      return res.status(200).json(data);
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };
}