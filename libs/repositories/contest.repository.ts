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

  async findAll(status?: string, search?: string, page: number = 1, limit: number = 10, userId?: string, countryId?: string) {
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

    if (countryId) {
      qb.andWhere(":countryId = ANY(contest.available_countries)", { countryId });
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

  async publishAndOfflineContests(): Promise<{ published: Contest[]; offlined: Contest[] }> {
    const now = new Date();
    const contestsToPublish = await this.repo.createQueryBuilder("contest")
      .where("contest.status = :status", { status: "Draft" })
      .andWhere("contest.start_date <= :now", { now })
      .getMany();

    if (contestsToPublish.length > 0) {
      for (const contest of contestsToPublish) {
        contest.status = "Published";
      }
      await this.repo.save(contestsToPublish);
    }

    const contestsToOffline = await this.repo.createQueryBuilder("contest")
      .where("contest.status = :status", { status: "Published" })
      .andWhere("contest.end_date <= :now", { now })
      .getMany();

    if (contestsToOffline.length > 0) {
      for (const contest of contestsToOffline) {
        contest.status = "Offline";
      }
      await this.repo.save(contestsToOffline);
    }

    return {
      published: contestsToPublish,
      offlined: contestsToOffline,
    };
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