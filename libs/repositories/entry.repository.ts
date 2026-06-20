import { AppDataSource } from "@libs/database/data-source";
import { Entry } from "@libs/entities";
import { In } from "typeorm";

export class EntryRepository {
  private repo = AppDataSource.getRepository(Entry);

  create(data: Partial<Entry>) {
    return this.repo.create(data);
  }

  save(entry: Entry) {
    return this.repo.save(entry);
  }

  findByContest(contest_id: string, status?: string, page?: number, limit?: number) {
    const where: any = { contest_id };
    if (status) {
      where.status = status;
    }
    const options: any = {
      where,
      relations: ["participant", "submission"],
      order: { created_at: "DESC" },
    };
    if (page !== undefined && limit !== undefined) {
      options.skip = (page - 1) * limit;
      options.take = limit;
      return this.repo.findAndCount(options);
    }
    return this.repo.find(options).then(docs => [docs, docs.length] as [Entry[], number]);
  }

  findByParticipant(contest_id: string, participant_id: string, status?: string, page?: number, limit?: number) {
    const where: any = { contest_id, participant_id };
    if (status) {
      where.status = status;
    }
    const options: any = {
      where,
      relations: ["participant", "submission"],
      order: { created_at: "DESC" },
    };
    if (page !== undefined && limit !== undefined) {
      options.skip = (page - 1) * limit;
      options.take = limit;
      return this.repo.findAndCount(options);
    }
    return this.repo.find(options).then(docs => [docs, docs.length] as [Entry[], number]);
  }

  findById(id: string, contest_id: string) {
    return this.repo.findOne({
      where: { id, contest_id },
      relations: ["participant", "submission", "votes", "contest", "contest.entryLevelTemplate"],
    });
  }

  findByIds(ids: string[]) {
    return this.repo.find({
      where: { id: In(ids) },
      relations: ["participant", "submission"],
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