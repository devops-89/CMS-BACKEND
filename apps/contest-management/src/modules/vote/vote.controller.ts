import { Request, Response } from "express";
import { VoteService } from "./vote.service";

const service = new VoteService();

type ContestParams = { contestId: string };
type VoteParams = { contestId: string; vid: string };

export class VoteController {
  cast = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.castVote(req.params.contestId, {
        ...req.body,
        ip_address: req.ip,  // auto-capture ip from request
      });
      return res.status(201).json({ message: "Vote cast successfully", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  getAll = async (req: Request<ContestParams>, res: Response) => {
    try {
      const search = req.query.search as string | undefined;
      const data = await service.getVotes(req.params.contestId, search);
      return res.status(200).json({ message: "Votes fetched", data });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  delete = async (req: Request<VoteParams>, res: Response) => {
    try {
      const data = await service.deleteVote(req.params.vid, req.params.contestId);
      return res.status(200).json(data);
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };
}