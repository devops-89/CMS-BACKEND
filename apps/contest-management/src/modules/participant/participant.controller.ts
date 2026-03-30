import { Request, Response } from "express";
import { ParticipantService } from "./participant.service";

const service = new ParticipantService();

// param shapes
type ContestParams = { contestId: string };
type ParticipantParams = { contestId: string; pid: string };

export class ParticipantController {
  add = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.addParticipant(req.params.contestId, req.body);
      return res.status(201).json({ message: "Participant added", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  getAll = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.getParticipants(req.params.contestId);
      return res.status(200).json({ message: "Participants fetched", data });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  getOne = async (req: Request<ParticipantParams>, res: Response) => {
    try {
      const data = await service.getParticipantById(req.params.pid, req.params.contestId);
      return res.status(200).json({ message: "Participant fetched", data });
    } catch (e: any) {
      return res.status(e.statusCode || 404).json({ message: e.message });
    }
  };

  updateStatus = async (req: Request<ParticipantParams>, res: Response) => {
    try {
      const data = await service.updateStatus(
        req.params.pid,
        req.params.contestId,
        req.body.status
      );
      return res.status(200).json({ message: "Status updated", data });
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
  };

  remove = async (req: Request<ParticipantParams>, res: Response) => {
    try {
      const data = await service.removeParticipant(req.params.pid, req.params.contestId);
      return res.status(200).json(data);
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };
}