import { AppDataSource } from "@libs/database/data-source";
import {Participant} from "@libs/entities";

export class ParticipantRepository {
  private repo = AppDataSource.getRepository(Participant);

  create(data: Partial<Participant>) {
    return this.repo.create(data);
  }

  save(participant: Participant) {
    return this.repo.save(participant);
  }

  findByContest(contest_id: string) {
    return this.repo.find({
      where: { contest_id },
      relations: ["submission"],
      order: { joined_at: "DESC" },
    });
  }

  findById(id: string, contest_id: string) {
    return this.repo.findOne({
      where: { id, contest_id },
      relations: ["submission", "entries"],
    });
  }

  updateStatus(id: string, status: Participant["status"]) {
    return this.repo.update(id, { status });
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}