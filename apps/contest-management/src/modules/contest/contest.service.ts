import { ContestRepository, EntryRepository, ParticipantRepository, VotingPeriodRepository, ContestJudgeRepository, JudgeAssignedVotingPeriodRepository, CountryRepository } from "@libs/repositories";
import { NotFoundError, InternalServerError, ConflictError, UnprocessableEntityError, BadRequestError } from "@libs/utils/errors.util";
import { Contest, VotingPeriod, VotingType, Entry } from "@libs/entities";
export class ContestService {
  private repo = new ContestRepository();
  private participantRepo = new ParticipantRepository();
  private entryRepo = new EntryRepository();
  private votingPeriodRepo = new VotingPeriodRepository();
  private contestJudgeRepo = new ContestJudgeRepository();
  private judgeAssignedVotingPeriodRepo = new JudgeAssignedVotingPeriodRepository();
  private countryRepo = new CountryRepository();

   async createContestService(
    payload: {
      name: string;
      description?: string;
      start_date: string;
      end_date: string;
      available_regions?: string[];
      available_countries?: string[];
      status?: "Draft" | "Published" | "Offline";
      entry_level_template_id?: string;
      user_level_template_id?: string;
    },
    userId?: string
  ) {
    // check duplicate name
    const existing = await this.repo.findByName(payload.name);
    if (existing) throw new ConflictError("Contest with this name already exists");

    const start = new Date(payload.start_date);
    const end = new Date(payload.end_date);
    if (isNaN(start.getTime())) {
      throw new BadRequestError("Invalid start_date format");
    }
    if (isNaN(end.getTime())) {
      throw new BadRequestError("Invalid end_date format");
    }
    if (end <= start) {
      throw new BadRequestError("end_date must be after start_date");
    }

    // Validate available_countries if provided
    if (payload.available_countries) {
      for (const countryId of payload.available_countries) {
        const country = await this.countryRepo.findById(countryId);
        if (!country) {
          throw new BadRequestError(`Country with ID ${countryId} is not valid`);
        }
      }
    }

    const contest = this.repo.create({
      ...payload,
      start_date: new Date(payload.start_date),
      end_date: new Date(payload.end_date),
      status: payload.status ?? "Draft",
      created_by: userId,
    });
    return await this.repo.save(contest);
  }

  async getContests(status?: string, search?: string, page: number = 1, limit: number = 10, userId?: string, country?: string) {
    let countryId: string | undefined;
    if (country) {
      const resolvedCountry = await this.countryRepo.findByName(country);
      if (resolvedCountry) {
        countryId = resolvedCountry.id;
      } else {
        const resolvedCountryByCode = await this.countryRepo.findByCode(country);
        if (resolvedCountryByCode) {
          countryId = resolvedCountryByCode.id;
        } else {
          return {
            docs: [],
            totalDocs: 0,
            page,
            limit,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          };
        }
      }
    }
    return await this.repo.findAll(status, search, page, limit, userId, countryId);
  }

  async getContestById(id: string) {
    const contest = await this.repo.findById(id);
    if (!contest) throw new NotFoundError("Contest not found");
    return contest;
  }

async getContestOverview(id: string, userId?: string) {
  const contest = await this.repo.findById(id);
  if (!contest) throw new NotFoundError("Contest not found");

  if (userId) {
    const isParticipant = await this.participantRepo.findOne({
      where: { contest_id: id, user_id: userId }
    });
    if (!isParticipant) {
      throw new NotFoundError("Contest not found");
    }
  }

  const stats = await this.repo.getStats(id);

  //  participants
  const participants = await this.participantRepo.findByContest(id);

  const cleanedParticipants = participants.map((p) => {
    if (p.submission?.data) {
      delete p.submission.data.password;
      delete p.submission.data.confirm_password;
    }
    return p;
  });

  //  entries
  const entries = await this.entryRepo.findByContest(id);

  const cleanedEntries = entries.map((e) => {
    // optional cleanup
    return e;
  });

  return {
    ...contest,

    // stats
    total_entries: parseInt(stats?.total_entries || "0"),
    needs_moderation: parseInt(stats?.needs_moderation || "0"),
    total_votes: parseInt(stats?.total_votes || "0"),

    // participants
    participants: cleanedParticipants,
    total_participants: cleanedParticipants.length,

    // NEW
    entries: cleanedEntries,
    total_entries_list: cleanedEntries.length,
  };
}


  async updateContest(
    id: string,
    payload: Partial<{
      name: string;
      description: string;
      start_date: string;
      end_date: string;
      available_regions: string[];
      available_countries: string[];
      form_template_id: string;
      entry_level_template_id: string;
      user_level_template_id: string;
      status: "Draft" | "Published" | "Offline";
    }>
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Contest not found");

    // check duplicate name only if name is being changed
    if (payload.name && payload.name !== existing.name) {
      const nameTaken = await this.repo.findByName(payload.name);
      if (nameTaken) throw new ConflictError("Contest with this name already exists");
    }

    const start = payload.start_date ? new Date(payload.start_date) : existing.start_date;
    const end = payload.end_date ? new Date(payload.end_date) : existing.end_date;

    if (payload.start_date && isNaN(start.getTime())) {
      throw new BadRequestError("Invalid start_date format");
    }
    if (payload.end_date && isNaN(end.getTime())) {
      throw new BadRequestError("Invalid end_date format");
    }
    if (end <= start) {
      throw new BadRequestError("end_date must be after start_date");
    }

    const updateData: Partial<Contest> = {};

    if (payload.name)                    updateData.name = payload.name;
    if (payload.description)             updateData.description = payload.description;
    if (payload.available_regions)       updateData.available_regions = payload.available_regions;
    if (payload.form_template_id)        updateData.form_template_id = payload.form_template_id;
    if (payload.start_date)              updateData.start_date = new Date(payload.start_date);
    if (payload.end_date)                updateData.end_date = new Date(payload.end_date);
    if (payload.entry_level_template_id) updateData.entry_level_template_id = payload.entry_level_template_id;
    if (payload.user_level_template_id)  updateData.user_level_template_id = payload.user_level_template_id;
    if (payload.status)                  updateData.status = payload.status;

    if (payload.available_countries) {
      for (const countryId of payload.available_countries) {
        const country = await this.countryRepo.findById(countryId);
        if (!country) {
          throw new BadRequestError(`Country with ID ${countryId} is not valid`);
        }
      }
      updateData.available_countries = payload.available_countries;
    }

    try {
      await this.repo.update(id, updateData);
      return await this.repo.findById(id);
    } catch {
      throw new InternalServerError("Failed to update contest");
    }
  }

  async updateStatus(id: string, status: "Draft" | "Published" | "Offline") {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Contest not found");
    await this.repo.update(id, { status });
    return await this.repo.findById(id);
  }

  async deleteContest(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Contest not found");

    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new InternalServerError("Delete failed");

    return { message: "Contest deleted successfully" };
  }

  async createVotingPeriodService(
    contestId: string,
    payload: {
      voting_type: VotingType;
      start_date: string;
      end_date: string;
      max_score?: number;
      criteria?: { description: string; weighting: number }[];
      judge_ids?: string[];
    }
  ) {
    const contest = await this.repo.findById(contestId);
    if (!contest) throw new NotFoundError("Contest not found");

    const existingPeriods = await this.votingPeriodRepo.findByContestId(contestId);
    const isDuplicate = existingPeriods.some(vp => vp.voting_type === payload.voting_type);
    if (isDuplicate) {
      throw new ConflictError(`Voting period of type ${payload.voting_type} already exists for this contest`);
    }

    if (payload.judge_ids && payload.judge_ids.length > 0) {
      const contestJudges = await this.contestJudgeRepo.findByContest(contestId);
      const activeJudgeUserIds = contestJudges
        .filter((cj) => cj.status === "active")
        .map((cj) => cj.judgeProfile?.user?.id)
        .filter((id): id is string => !!id);

      for (const judgeId of payload.judge_ids) {
        if (!activeJudgeUserIds.includes(judgeId)) {
          throw new BadRequestError(`Judge with ID ${judgeId} does not belong to this contest`);
        }
      }
    }

    const start = new Date(payload.start_date);
    const end = new Date(payload.end_date);

    if (isNaN(start.getTime())) {
      throw new BadRequestError("Invalid start_date format");
    }
    if (isNaN(end.getTime())) {
      throw new BadRequestError("Invalid end_date format");
    }
    if (end <= start) {
      throw new BadRequestError("end_date must be after start_date");
    }

    let maxScoreVal: number | null = null;
    let criteriaVal: { description: string; weighting: number }[] | null = null;

    if (payload.voting_type === VotingType.JUDGE) {
      if (payload.max_score === undefined || payload.max_score === null) {
        throw new UnprocessableEntityError("max_score is required when voting_type is JUDGE");
      }
      if (!payload.criteria || !Array.isArray(payload.criteria) || payload.criteria.length === 0) {
        throw new UnprocessableEntityError("criteria is required and must be a non-empty array when voting_type is JUDGE");
      }

      let sumWeightings = 0;
      for (const item of payload.criteria) {
        if (!item.description || typeof item.description !== 'string') {
          throw new BadRequestError("Each criterion must have a valid description");
        }
        if (item.weighting === undefined || item.weighting === null || typeof item.weighting !== 'number') {
          throw new BadRequestError("Each criterion must have a valid numerical weighting");
        }
        sumWeightings += item.weighting;
      }

      if (sumWeightings !== payload.max_score) {
        throw new BadRequestError("The sum of criteria weightings must equal the maximum score");
      }

      maxScoreVal = payload.max_score;
      criteriaVal = payload.criteria;
    }

    const votingPeriod = this.votingPeriodRepo.create({
      contest_id: contestId,
      voting_type: payload.voting_type,
      start_date: start,
      end_date: end,
      is_active: true,
      max_score: maxScoreVal,
      criteria: criteriaVal,
    });

    const savedVotingPeriod = await this.votingPeriodRepo.save(votingPeriod);

    if (payload.judge_ids && payload.judge_ids.length > 0) {
      for (const judgeId of payload.judge_ids) {
        const assigned = this.judgeAssignedVotingPeriodRepo.create({
          voting_period_id: savedVotingPeriod.id,
          judge_id: judgeId,
        });
        await this.judgeAssignedVotingPeriodRepo.save(assigned);
      }
    }

    return savedVotingPeriod;
  }

  async getVotingPeriods(contestId: string) {
    const contest = await this.repo.findById(contestId);
    if (!contest) throw new NotFoundError("Contest not found");

    return await this.votingPeriodRepo.findByContestId(contestId);
  }

  async getVotingPeriodDetail(id: string) {
    const votingPeriod = await this.votingPeriodRepo.findById(id);
    if (!votingPeriod) throw new NotFoundError("Voting period not found");
    return votingPeriod;
  }

  async updateVotingPeriod(
    id: string,
    payload: Partial<{
      voting_type: VotingType;
      start_date: string;
      end_date: string;
      is_active: boolean;
      max_score: number;
      criteria: { description: string; weighting: number }[];
      judge_ids: string[];
    }>
  ) {
    const existing = await this.votingPeriodRepo.findById(id);
    if (!existing) throw new NotFoundError("Voting period not found");

    const contestId = existing.contest_id;

    // Check for duplicate voting period type if voting_type is being updated
    // if (payload.voting_type && payload.voting_type !== existing.voting_type) {
    //   const existingPeriods = await this.votingPeriodRepo.findByContestId(contestId);
    //   const isDuplicate = existingPeriods.some(vp => vp.voting_type === payload.voting_type && vp.id !== id);
    //   if (isDuplicate) {
    //     throw new ConflictError(`Voting period of type ${payload.voting_type} already exists for this contest`);
    //   }
    // }

    // Validate judge_ids if provided
    if (payload.judge_ids && payload.judge_ids.length > 0) {
      const contestJudges = await this.contestJudgeRepo.findByContest(contestId);
      const activeJudgeUserIds = contestJudges
        .filter((cj) => cj.status === "active")
        .map((cj) => cj.judgeProfile?.user?.id)
        .filter((id): id is string => !!id);

      for (const judgeId of payload.judge_ids) {
        if (!activeJudgeUserIds.includes(judgeId)) {
          throw new BadRequestError(`Judge with ID ${judgeId} does not belong to this contest`);
        }
      }
    }

    const updateData: Partial<VotingPeriod> = {};

    if (payload.voting_type) {
      updateData.voting_type = payload.voting_type;
    }

    if (payload.is_active !== undefined) {
      updateData.is_active = payload.is_active;
    }

    const start = payload.start_date ? new Date(payload.start_date) : existing.start_date;
    const end = payload.end_date ? new Date(payload.end_date) : existing.end_date;

    if (payload.start_date) {
      if (isNaN(start.getTime())) {
        throw new ConflictError("Invalid start_date format");
      }
      updateData.start_date = start;
    }

    if (payload.end_date) {
      if (isNaN(end.getTime())) {
        throw new ConflictError("Invalid end_date format");
      }
      updateData.end_date = end;
    }

    if (end <= start) {
      throw new ConflictError("end_date must be after start_date");
    }

    const finalVotingType = payload.voting_type ?? existing.voting_type;
    if (finalVotingType === VotingType.JUDGE) {
      const finalMaxScore = payload.max_score !== undefined ? payload.max_score : existing.max_score;
      const finalCriteria = payload.criteria !== undefined ? payload.criteria : existing.criteria;

      if (finalMaxScore === undefined || finalMaxScore === null) {
        throw new UnprocessableEntityError("max_score is required when voting_type is JUDGE");
      }
      if (!finalCriteria || !Array.isArray(finalCriteria) || finalCriteria.length === 0) {
        throw new UnprocessableEntityError("criteria is required and must be a non-empty array when voting_type is JUDGE");
      }

      let sumWeightings = 0;
      for (const item of finalCriteria) {
        if (!item.description || typeof item.description !== 'string') {
          throw new BadRequestError("Each criterion must have a valid description");
        }
        if (item.weighting === undefined || item.weighting === null || typeof item.weighting !== 'number') {
          throw new BadRequestError("Each criterion must have a valid numerical weighting");
        }
        sumWeightings += item.weighting;
      }

      if (sumWeightings !== finalMaxScore) {
        throw new BadRequestError("The sum of criteria weightings must equal the maximum score");
      }

      updateData.max_score = finalMaxScore;
      updateData.criteria = finalCriteria;
    } else {
      updateData.max_score = null;
      updateData.criteria = null;
    }

    try {
      await this.votingPeriodRepo.update(id, updateData);

      if (payload.judge_ids !== undefined) {
        // Remove existing judge assignments for this voting period
        await this.judgeAssignedVotingPeriodRepo.deleteByVotingPeriodId(id);

        // Save new judge assignments
        if (payload.judge_ids.length > 0) {
          for (const judgeId of payload.judge_ids) {
            const assigned = this.judgeAssignedVotingPeriodRepo.create({
              voting_period_id: id,
              judge_id: judgeId,
            });
            await this.judgeAssignedVotingPeriodRepo.save(assigned);
          }
        }
      }

      return await this.votingPeriodRepo.findById(id);
    } catch {
      throw new InternalServerError("Failed to update voting period");
    }
  }

  async bulkUpdateEntriesStatus(
    contestId: string,
    entryIds: string[],
    status: Entry["status"]
  ) {
    const contest = await this.repo.findById(contestId);
    if (!contest) throw new NotFoundError("Contest not found");

    const entries = await this.entryRepo.findByIds(entryIds);

    const foundIds = entries.map((e) => e.id);
    const missingIds = entryIds.filter((id) => !foundIds.includes(id));
    if (missingIds.length > 0) {
      throw new BadRequestError(`Entries not found: ${missingIds.join(", ")}`);
    }

    for (const entry of entries) {
      if (entry.contest_id !== contestId) {
        throw new BadRequestError(`Entry ${entry.id} does not belong to contest ${contestId}`);
      }
      if (entry.status !== "pending") {
        throw new BadRequestError(`Entry ${entry.id} is not in pending status`);
      }
    }

    for (const entryId of entryIds) {
      await this.entryRepo.updateStatus(entryId, status);
    }

    return await this.entryRepo.findByIds(entryIds);
  }
}