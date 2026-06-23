import { Request, Response } from "express";
import { ContestJudgeService } from "./judge.service";
import { AuthRequest } from "@libs/middlewares/auth.middleware";
import { NotificationService } from "@libs/notifications/notification.service";
import { TEMPLATE_AUDIENCE, TEMPLATE_EVENT_TYPE } from "@libs/entities";

const service = new ContestJudgeService();
const notificationService = new NotificationService();

type ContestParams = { contestId: string };
type JudgeParams = { contestId: string; jid: string };
type RemoveJudgeParams = { contestId: string; judgeId: string };

export class ContestJudgeController {
  assign = async (req: Request<ContestParams>, res: Response) => {
    try {
      const { contestJudge, assignments, judge, contest } = await service.assignJudge(req.params.contestId, req.body);

      if (judge?.email) {
        const judgeName = judge.fullName || `${judge.firstName || ""} ${judge.lastName || ""}`.trim() || "Judge";
        await notificationService.sendTemplateNotification(
          judge.email,
          req.params.contestId,
          TEMPLATE_AUDIENCE.JUDGE,
          TEMPLATE_EVENT_TYPE.ASSIGNED_AS_JUDGE,
          {
            judge_name: judgeName,
            contest_name: contest?.name || "",
          }
        ).catch((err) => {
          console.error("Failed to send template notification to judge:", err);
        });
      }

      return res.status(201).json({
        message: "Judge assigned to contest",
        data: { contestJudge, assignments },
      });
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
      const data = await service.evaluateEntryService(judgeId, entryId, req.body);
      return res.status(200).json(data);
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  getEvaluation = async (req: AuthRequest<{ entryId: string }>, res: Response) => {
    try {
      const judgeId = req.user!.userId;
      const { entryId } = req.params;
      const data = await service.getEvaluationService(judgeId, entryId);
      return res.status(200).json(data);
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  updateEvaluation = async (req: AuthRequest<{ entryId: string }>, res: Response) => {
    try {
      const judgeId = req.user!.userId;
      const { entryId } = req.params;
      const data = await service.updateEvaluationService(judgeId, entryId, req.body);
      return res.status(200).json(data);
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };
}