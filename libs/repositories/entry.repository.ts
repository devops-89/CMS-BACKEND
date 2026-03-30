import { AppDataSource } from "@libs/database/data-source";
import { Entry } from "@libs/entities";

export class EntryRepository {
  private repo = AppDataSource.getRepository(Entry);

  create(data: Partial<Entry>) {
    return this.repo.create(data);
  }

  save(entry: Entry) {
    return this.repo.save(entry);
  }

  findByContest(contest_id: string) {
    return this.repo.find({
      where: { contest_id },
      relations: ["participant", "participant.submission"],
      order: { created_at: "DESC" },
    });
  }

  findById(id: string, contest_id: string) {
    return this.repo.findOne({
      where: { id, contest_id },
      relations: ["participant", "participant.submission", "votes"],
    });
  }

  updateStatus(id: string, status: Entry["status"]) {
    return this.repo.update(id, { status });
  }

  updateScore(id: string, score: number) {
    return this.repo.update(id, { score });
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}