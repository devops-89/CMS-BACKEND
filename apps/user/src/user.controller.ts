import { Request, Response } from "express";
import {
  ParticipantProfileRepository,
  UserRepository,
  JudgeProfileRepository,
  AdminProfileRepository,
  ParticipantRepository,
  FormSubmissionRepository,
} from "@libs/repositories";

import {
    deleteUserByIdDto,
    deleteUserByIdSchema,
    getUserByIdDto,
  getUsersQueryDto,
  
  updateAvatarDto,
  updateUserStatusDto,
  updateUserDto,
  verifyParticipantDto,
  createParticipantDto,
  createPublicUserDto,
  verifyPublicUserDto,
} from "@libs/dto/user.dto";
import { AuthRequest } from "@libs/middlewares/auth.middleware";
import { UserService } from "./user.service";
import { S3Service } from "@libs/s3";

export class UserController {
  private userRepo = new UserRepository();
  private adminRepo = new AdminProfileRepository();
  private judgeRepo = new JudgeProfileRepository();
  private participantRepo = new ParticipantProfileRepository();
  private participantEntityRepo = new ParticipantRepository();
  private submissionRepo = new FormSubmissionRepository();
  private userService = new UserService();
  private s3Service = new S3Service();



  // update the profile pic adding
  async updateAvatar(req: AuthRequest<{}, {}, updateAvatarDto>, res: Response) {
    try {
      const userId = req.user!.userId;
      const { avatarUrl } = req.body;

      const updated = await this.userRepo.updateAvatar(userId, avatarUrl);

      return res.status(200).json({
        message: "Avatar Updated Successfully.",
        data: updated,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed To Update Avatar!",
        error: error.message,
      });
    }
  }

// Update the User Status
  async updateUserStatus(
    req: AuthRequest<updateUserStatusDto>,
    res: Response
  ) {
    try {
      const { id, status, contestId } = req.body;

      const existing = await this.userRepo.getUserById(id);
      if (!existing) {
        return res.status(404).json({
          message: "User Not Found!",
        });
      }

      if (existing.role === "participant") {
        if (!contestId) {
          return res.status(400).json({
            message: "Contest ID is required for participant users!",
          });
        }

        const existingParticipant = await this.participantEntityRepo.findOne({
          where: {
            contest_id: contestId,
            user_id: id,
          },
        });

        if (!existingParticipant) {
          return res.status(404).json({
            message: "Participant not found for this contest!",
          });
        }

        await this.participantEntityRepo.updateStatus(existingParticipant.id, status as any);

        return res.status(200).json({
          message: "Participant status updated successfully",
          data: {
            id: existingParticipant.id,
            userId: id,
            contestId,
            status,
          },
        });
      }

      const updated = await this.userRepo.updateUserStatus(id, status as any);

      return res.status(200).json({
        message: "User status updated successfully",
        data: updated,
      });

    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to update status!",
        error: error.message,
      });
    }
  }

  // get all users with role filter
 async getAllUsers(
  req: AuthRequest,
  res: Response
) {
  try {
    const { role, page, limit, search } = req.query as getUsersQueryDto;

    const result = await this.userRepo.getUsers({
      role,
      page,
      limit,
      search
    });

    if (result.users && result.users.length > 0) {
      for (const user of result.users) {
        if (user.avatarUrl) {
          try {
            (user as any).avatarDownloadUrl = await this.s3Service.getDownloadUrl(user.avatarUrl);
          } catch (e) {
            console.error("Failed to generate download url for user avatar", e);
          }
        }
      }
    }

    return res.status(200).json({
      message: "Users Fetched Successfully.",
      data: result
    });

  } catch (error: any) {

    return res.status(500).json({
      message: "Failed To Fetch Users!",
      error: error.message
    });

  }
}

// get User Detail By Id
async getUserById(req:AuthRequest<getUserByIdDto>, res:Response){
    try{
        const {id}=req.params;

        const user=await this.userRepo.getUserById(id);

        if(!user){
            return res.status(404).json({
                message:"User Not Found!"
            });
        }

        if (user && user.avatarUrl) {
          try {
            (user as any).avatarDownloadUrl = await this.s3Service.getDownloadUrl(user.avatarUrl);
          } catch (e) {
            console.error("Failed to generate download url for user avatar", e);
          }
        }

        if (user) {
          if (user.participant_profile_data) {
            user.participant_profile_data = await this.appendDownloadUrlsToData(user.participant_profile_data);
          }
          if (user.participantProfile?.submission?.data) {
            user.participantProfile.submission.data = await this.appendDownloadUrlsToData(user.participantProfile.submission.data);
          }
          if (user.participants && Array.isArray(user.participants)) {
            for (const p of user.participants) {
              if (p.submission?.data) {
                p.submission.data = await this.appendDownloadUrlsToData(p.submission.data);
              }
              if (p.entries && Array.isArray(p.entries)) {
                for (const entry of p.entries) {
                  if (entry.submission?.data) {
                    entry.submission.data = await this.appendDownloadUrlsToData(entry.submission.data);
                  }
                }
              }
            }
          }
        }

        return res.status(200).json({
            message:"User Fetched Successfully.",
            data:user
        })

    }
    catch(error:any){
        return res.status(500).json({
            message:"Failed To Fetch User!",
            error:error.message
        })

    }
}

// Get User Details by Token
async getUserDetailsByToken(req: AuthRequest, res: Response) {
    try {
        const userId = req.user!.userId;

        const user = await this.userRepo.getUserById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User Not Found!"
            });
        }

        if (user && user.avatarUrl) {
            try {
                (user as any).avatarDownloadUrl = await this.s3Service.getDownloadUrl(user.avatarUrl);
            } catch (e) {
                console.error("Failed to generate download url for user avatar", e);
            }
        }

        if (user) {
            if (user.participant_profile_data) {
                user.participant_profile_data = await this.appendDownloadUrlsToData(user.participant_profile_data);
            }
            if (user.participantProfile?.submission?.data) {
                user.participantProfile.submission.data = await this.appendDownloadUrlsToData(user.participantProfile.submission.data);
            }
            if (user.participants && Array.isArray(user.participants)) {
                for (const p of user.participants) {
                    if (p.submission?.data) {
                        p.submission.data = await this.appendDownloadUrlsToData(p.submission.data);
                    }
                    if (p.entries && Array.isArray(p.entries)) {
                        for (const entry of p.entries) {
                            if (entry.submission?.data) {
                                entry.submission.data = await this.appendDownloadUrlsToData(entry.submission.data);
                            }
                        }
                    }
                }
            }
        }

        return res.status(200).json({
            message: "User Details Fetched Successfully.",
            data: user
        });
    } catch (error: any) {
        return res.status(500).json({
            message: "Failed To Fetch User Details!",
            error: error.message
        });
    }
}

// delete User by Id
async deleteUserById(req:AuthRequest<deleteUserByIdDto>,res:Response){
    try{
      const {id}=req.params;

      const deleted=await this.userRepo.deleteUser(id);

      if(!deleted){
        return res.status(404).json({
            message:"User Not Found!"
        });
    }

        return res.status(200).json({
            message:"User Deleted Suceessfully.",
            data:{id}
        });


      
    }
    catch(error:any){

        return res.status(500).json({
           message:"Failed To Delete The User!",
           error:error.message
        });

    }
}

async updateUserDetails(req: AuthRequest<{ id: string }, {}, updateUserDto>, res: Response) {
    try {
        const userId = req.params.id || (req.body as any).userId || (req.body as any).id;
        
        if (!userId) {
            return res.status(400).json({
                message: "User ID is required!"
            });
        }

        const existing = await this.userRepo.getUserById(userId);
        if (!existing) {
            return res.status(404).json({
                message: "User Not Found!"
            });
        }

        // Handle file uploads if files are attached
        const files = req.files as any[];
        if (files && files.length > 0) {
            for (const file of files) {
                if (file.fieldname === "avatar" || file.fieldname === "avatarUrl") {
                    const key = `users/avatar-${userId}-${Date.now()}-${file.originalname}`;
                    const url = await this.s3Service.uploadFile(key, file.buffer, file.mimetype);
                    req.body.avatarUrl = url;
                } else if (file.fieldname === "file") {
                    const key = `users/profile-${userId}/file-${Date.now()}-${file.originalname}`;
                    const url = await this.s3Service.uploadFile(key, file.buffer, file.mimetype);
                    req.body.file = url;

                    let fileFieldId: string | null = null;
                    const template = existing.participantProfile?.submission?.template || existing.formTemplate;
                    if (template && template.schema && Array.isArray(template.schema.fields)) {
                        const fileField = template.schema.fields.find(
                            (field: any) => field.type === "file_upload" || field.type === "file"
                        );
                        if (fileField) {
                            fileFieldId = fileField.id;
                        }
                    }

                    if (fileFieldId) {
                        req.body[fileFieldId] = url;
                    }

                    if (existing.role === "participant" && existing.participantProfile?.submission) {
                        const submission = existing.participantProfile.submission;
                        const submissionData = submission.data || {};
                        const keyToUpdate = fileFieldId || "file";
                        submissionData[keyToUpdate] = url;
                        await this.submissionRepo.update(submission.id, submissionData);
                    }
                } else {
                    const key = `users/profile-${userId}/${file.fieldname}-${Date.now()}-${file.originalname}`;
                    const url = await this.s3Service.uploadFile(key, file.buffer, file.mimetype);
                    
                    req.body[file.fieldname] = url;

                    // Support nested keys like formData[field]
                    const match = file.fieldname.match(/formData\[(.*?)\]/);
                    if (match && match[1]) {
                        req.body[match[1]] = url;
                    }
                }
            }
        }

        // Standard user table fields to update
        const userFields = ["firstName", "lastName", "fullName", "phone", "email", "avatarUrl", "countryId"];
        const userUpdateData: any = {};
        for (const key of userFields) {
            if (req.body[key] !== undefined) {
                userUpdateData[key] = req.body[key];
            }
        }

        // Auto-generate fullName if firstName or lastName is updated
        if ((req.body.firstName || req.body.lastName) && !req.body.fullName) {
            const fn = req.body.firstName !== undefined ? req.body.firstName : (existing.firstName || "");
            const ln = req.body.lastName !== undefined ? req.body.lastName : (existing.lastName || "");
            userUpdateData.fullName = `${fn} ${ln}`.trim();
        }

        // If user is a participant, update JSONB and ParticipantProfile table
        if (existing.role === "participant") {
            const updatedProfileData = {
                ...(existing.participant_profile_data || {}),
                ...req.body,
            };

            // Remove standard user properties from JSONB to keep it clean
            for (const key of userFields) {
                delete updatedProfileData[key];
            }
            delete updatedProfileData.userId;
            delete updatedProfileData.id;

            userUpdateData.participant_profile_data = updatedProfileData;

            // Update/Create ParticipantProfile entry
            const profileUpdateData: any = {};
            
            if (req.body.dateOfBirth !== undefined) {
                profileUpdateData.dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
            } else if ((req.body as any).dob !== undefined) {
                profileUpdateData.dateOfBirth = (req.body as any).dob ? new Date((req.body as any).dob) : null;
            }

            if ((req.body as any).schoolName !== undefined) {
                profileUpdateData.schoolName = (req.body as any).schoolName;
            } else if ((req.body as any).school !== undefined) {
                profileUpdateData.schoolName = (req.body as any).school;
            }

            if ((req.body as any).grade !== undefined) {
                profileUpdateData.grade = (req.body as any).grade;
            } else if ((req.body as any).class !== undefined) {
                profileUpdateData.grade = (req.body as any).class;
            }

            if ((req.body as any).country !== undefined) {
                profileUpdateData.country = (req.body as any).country;
            }

            if (Object.keys(profileUpdateData).length > 0) {
                const profile = await this.participantRepo.findByUserId(userId);
                if (profile) {
                    await this.participantRepo.updateParticipantProfile(userId, profileUpdateData);
                } else {
                    await this.participantRepo.createProfile({
                        user: existing,
                        ...profileUpdateData,
                    });
                }
            }

            // Update submission data if present
            const submission = existing.participantProfile?.submission;
            if (submission) {
                const submissionData = submission.data || {};
                let hasChanges = false;
                for (const key of Object.keys(submissionData)) {
                    if (req.body[key] !== undefined) {
                        submissionData[key] = req.body[key];
                        hasChanges = true;
                    }
                }
                if (hasChanges) {
                    await this.submissionRepo.update(submission.id, submissionData);
                }
            }
        }

        // If user is a judge, update JudgeProfile table
        if (existing.role === "judge" && req.body.expertise !== undefined) {
            let expertiseArray: string[] | null = null;
            const val = req.body.expertise;
            if (Array.isArray(val)) {
                expertiseArray = val.map(v => String(v).trim());
            } else if (typeof val === "string") {
                if (val.trim() === "") {
                    expertiseArray = [];
                } else if (val.startsWith("[") && val.endsWith("]")) {
                    try {
                        const parsed = JSON.parse(val);
                        if (Array.isArray(parsed)) {
                            expertiseArray = parsed.map(v => String(v).trim());
                        }
                    } catch (e) {
                        expertiseArray = val.split(",").map(v => v.trim()).filter(Boolean);
                    }
                } else {
                    expertiseArray = val.split(",").map(v => v.trim()).filter(Boolean);
                }
            } else if (val === null) {
                expertiseArray = null;
            }

            const profile = await this.judgeRepo.findByUserId(userId);
            if (profile) {
                await this.judgeRepo.updateJudgeProfile(userId, { expertise: expertiseArray });
            } else {
                await this.judgeRepo.createProfile({
                    user: existing,
                    expertise: expertiseArray,
                });
            }
        }

        // Save User changes
        if (Object.keys(userUpdateData).length > 0) {
            await this.userRepo.updateUser(userId, userUpdateData);
        }

        // Retrieve full updated details
        const updated = await this.userRepo.getUserById(userId);

        return res.status(200).json({
            message: "User Details Updated Successfully.",
            data: updated
        });
    } catch (error: any) {
        return res.status(500).json({
            message: "Failed To Update User Details!",
            error: error.message
        });
    }
}

// Create participant with pending status and trigger OTP email
async createParticipant(req: Request<{}, {}, createParticipantDto>, res: Response) {
    try {
        const user = await this.userService.createParticipantService(req.body, req.files as any[]);
        return res.status(201).json({
            message: "Participant registered successfully. Please verify the OTP sent to your email.",
            data: {
                userId: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                status: user.status,
            },
        });
    } catch (error: any) {
        return res.status(error.statusCode || 500).json({
            message: "Failed to create participant!",
            error: error.message,
        });
    }
}

// Verify participant OTP and activate account
async verifyParticipant(req: Request<{}, {}, verifyParticipantDto>, res: Response) {
    try {
        const result = await this.userService.verifyParticipantService(req.body);
        return res.status(200).json({
            message: "Participant account activated successfully.",
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                user: result.user,
            },
        });
    } catch (error: any) {
        return res.status(error.statusCode || 500).json({
            message: "Verification failed!",
            error: error.message,
        });
    }
  }

  async createPublicUser(req: Request<{}, {}, createPublicUserDto>, res: Response) {
    try {
      const user = await this.userService.createPublicUserService(req.body);
      return res.status(201).json({
        message: "Public user registered successfully. Please verify the OTP sent to your email.",
        data: {
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        message: "Failed to create public user!",
        error: error.message,
      });
    }
  }

  async verifyPublicUser(req: Request<{}, {}, verifyPublicUserDto>, res: Response) {
    try {
      const result = await this.userService.verifyPublicUserService(req.body);
      return res.status(200).json({
        message: "Public user account activated successfully.",
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        },
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        message: "Verification failed!",
        error: error.message,
      });
    }
  }

  private async appendDownloadUrlsToData(data: Record<string, any>): Promise<Record<string, any>> {
    if (!data || typeof data !== "object") return data;

    const result = { ...data };
    for (const key of Object.keys(result)) {
      const val = result[key];
      if (typeof val === "string") {
        if (val.startsWith("http://") || val.startsWith("https://") || val.includes("users/")) {
          try {
            const usersIdx = val.indexOf("users/");
            const s3Key = usersIdx !== -1 ? val.substring(usersIdx) : val;
            const downloadUrl = await this.s3Service.getDownloadUrl(s3Key);
            result[`${key}_downloadUrl`] = downloadUrl;
          } catch (error) {
            console.error(`Failed to generate download URL for key ${key}:`, error);
          }
        }
      }
    }
    return result;
  }

  listEntries = async (req: AuthRequest, res: Response) => {
    try {
      const { status, page, limit, search } = req.query as Record<string, string>;
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;

      const data = await this.userService.listEntriesService(status, pageNum, limitNum, search);

      return res.status(200).json({
        message: "Entries fetched successfully.",
        data,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        message: "Failed to fetch entries!",
        error: error.message,
      });
    }
  };
}
