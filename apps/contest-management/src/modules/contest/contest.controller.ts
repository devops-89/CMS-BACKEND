import { Request, Response } from "express";
import { ContestService } from "./contest.service";
import { AuthRequest } from "@libs/middlewares/auth.middleware";
import { UserRole, TEMPLATE_AUDIENCE, TEMPLATE_EVENT_TYPE } from "@libs/entities";
import { NotificationService } from "@libs/notifications/notification.service";
import jwt from "jsonwebtoken";

const service = new ContestService();
const notificationService = new NotificationService();

type ContestParams = { id: string };

export class ContestController {
  constructor() {
    console.log("[Cron Job] Contest publish scheduler initialized to run every 2 minutes.");
    // Run the cron job every 2 minutes (2 * 60 * 1000 ms)
    setInterval(async () => {
      try {
        console.log(`[Cron Job] Running scheduled check for upcoming contests at: ${new Date().toISOString()}`);
        await service.checkAndPublishContests();
      } catch (err: any) {
        console.error("[Cron Job] Error in background contest publish:", err.message);
      }
    }, 2 * 60 * 1000);
  }

  createContest = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const files = req.files as Express.Multer.File[];
      const imageFile = files?.find(
        (file) => file.fieldname === "image" || file.fieldname === "image_url" || file.fieldname === "imageUrl"
      );
      const data = await service.createContestService(req.body, userId, imageFile);
      return res.status(201).json({ message: "Contest created successfully", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  getAll = async (req: Request, res: Response) => {
    try {
      const { status, search, page, limit, country } = req.query as Record<string, string>;
      const parsedPage = page ? parseInt(page, 10) : 1;
      const parsedLimit = limit ? parseInt(limit, 10) : 10;

      let userId: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const parts = authHeader.split(" ");
        const token = parts.length === 2 ? parts[1] : parts[0];
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
            if (decoded.role === UserRole.PARTICIPANT) {
              userId = decoded.userId;
            }
          } catch (err) {
            return res.status(401).json({ message: "Invalid Token" });
          }
        }
      }

      const data = await service.getContests(status, search, parsedPage, parsedLimit, userId, country);
      return res.status(200).json({ message: "Contests fetched successfully", data });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  getOverview = async (req: Request<ContestParams>, res: Response) => {
    try {
      let userId: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const parts = authHeader.split(" ");
        const token = parts.length === 2 ? parts[1] : parts[0];
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
            if (decoded.role === UserRole.PARTICIPANT) {
              userId = decoded.userId;
            }
          } catch (err) {
            return res.status(401).json({ message: "Invalid Token" });
          }
        }
      }

      const data = await service.getContestOverview(req.params.id, userId);
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

  createVotingPeriod = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.createVotingPeriodService(req.params.id, req.body);
      return res.status(201).json({ message: "Voting period created", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  getVotingPeriods = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.getVotingPeriods(req.params.id);
      return res.status(200).json({ message: "Voting periods fetched", data });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  getVotingPeriodDetail = async (req: Request<{ votingPeriodId: string }>, res: Response) => {
    try {
      const data = await service.getVotingPeriodDetail(req.params.votingPeriodId);
      return res.status(200).json({ message: "Voting period details fetched", data });
    } catch (e: any) {
      return res.status(e.statusCode || 404).json({ message: e.message });
    }
  };

  updateVotingPeriod = async (req: Request<{ votingPeriodId: string }>, res: Response) => {
    try {
      const data = await service.updateVotingPeriod(req.params.votingPeriodId, req.body);
      return res.status(200).json({ message: "Voting period updated", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  bulkUpdateEntriesStatus = async (req: Request<ContestParams>, res: Response) => {
    try {
      const { entryIds, status, reason } = req.body;
      const data = await service.bulkUpdateEntriesStatus(req.params.id, entryIds, status, reason);

      if (status === "semifinal" || status === "final" || status === "winner") {
        const eventType = status === "semifinal"
          ? TEMPLATE_EVENT_TYPE.SELECTED_AS_SEMI_FINALIST
          : status === "final"
          ? TEMPLATE_EVENT_TYPE.SELECTED_AS_FINALIST
          : TEMPLATE_EVENT_TYPE.ANNOUNCED_AS_WINNER;

        for (const entry of data) {
          const participantUser = entry.participant?.user;
          if (participantUser?.email) {
            const participantName = participantUser.fullName || `${participantUser.firstName || ""} ${participantUser.lastName || ""}`.trim() || "Participant";
            const contestName = entry.contest?.name || "";

            notificationService.sendTemplateNotification(
              participantUser.email,
              req.params.id,
              TEMPLATE_AUDIENCE.PARTICIPANT,
              eventType,
              {
                participant_name: participantName,
                contest_name: contestName,
              }
            ).catch((err) => {
              console.error(`Failed to send email notification to ${participantUser.email}:`, err);
            });
          }
        }
      }

      return res.status(200).json({ message: "Entries updated successfully", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  triggerPublishCron = async (req: Request, res: Response) => {
    try {
      const { published, offlined } = await service.checkAndPublishContests();
      return res.status(200).json({
        message: "Cron job executed successfully",
        publishedCount: published.length,
        offlinedCount: offlined.length,
        published,
        offlined,
      });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };
}