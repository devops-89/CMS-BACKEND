import { Request, Response } from "express";
import { ContestService } from "./contest.service";
import { AuthRequest } from "@libs/middlewares/auth.middleware";
import { UserRole } from "@libs/entities";
import jwt from "jsonwebtoken";

const service = new ContestService();

type ContestParams = { id: string };

export class ContestController {
  createContest = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const data = await service.createContestService(req.body, userId);
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
      const { entryIds, status } = req.body;
      const data = await service.bulkUpdateEntriesStatus(req.params.id, entryIds, status);
      return res.status(200).json({ message: "Entries updated successfully", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };
}