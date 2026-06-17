import { AppDataSource } from "@libs/database/data-source";
import {Contest} from "@libs/entities/contest.entity";

export class ContestRepository {
  private repo = AppDataSource.getRepository(Contest);

  create(data: Partial<Contest>) {
    return this.repo.create(data);
  }

  save(contest: Contest) {
    return this.repo.save(contest);
  }

  findByName(name: string) {
  return this.repo.findOne({ where: { name } });
}

  async findAll(status?: string, search?: string, page: number = 1, limit: number = 10, userId?: string) {
    const qb = this.repo.createQueryBuilder("contest")
      .leftJoinAndSelect("contest.formTemplate", "formTemplate")
      .loadRelationCountAndMap("contest.participantCount", "contest.participants")
      .loadRelationCountAndMap("contest.entryCount", "contest.entries");

    if (status && status !== "all") {
      qb.andWhere("contest.status = :status", { status });
    }

    if (search) {
      qb.andWhere("contest.name ILIKE :search", { search: `%${search}%` });
    }

    if (userId) {
      qb.innerJoin("contest.participants", "filterParticipant", "filterParticipant.user_id = :userId", { userId });
    }

    qb.orderBy("contest.created_at", "DESC");

    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [docs, totalDocs] = await qb.getManyAndCount();

    const totalPages = Math.ceil(totalDocs / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      docs,
      totalDocs,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };
  }

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ["formTemplate", "userLevelTemplate", "entryLevelTemplate"],
    });
  }

  update(id: string, data: Partial<Contest>) {
    return this.repo.update(id, data);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }

  // for overview stats
  getStats(id: string) {
    return this.repo.createQueryBuilder("contest")
      .leftJoin("contest.entries", "entry")
      .leftJoin("contest.participants", "participant")
      .leftJoin("entry.votes", "vote")
      .select("contest.id")
      .addSelect("COUNT(DISTINCT entry.id)", "total_entries")
      .addSelect(
        "COUNT(DISTINCT entry.id) FILTER (WHERE entry.status = 'pending')",
        "needs_moderation"
      )
      .addSelect("COUNT(DISTINCT vote.id)", "total_votes")
      .where("contest.id = :id", { id })
      .groupBy("contest.id")
      .getRawOne();
  }
}