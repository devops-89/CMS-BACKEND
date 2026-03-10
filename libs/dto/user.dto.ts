import {z} from "zod";

export const updateAdminProfileSchema=z.object({
    adminCode:z.string().min(1).optional()
})

export const updateJudgeProfileSchema=z.object({
    judgeLicense:z.string().min(1).optional()
})

export const updateParticipantProfileSchema=z.object({
    score:z.number().min(0).optional()
})


// User typescript dtos
export type updateAdminProfileDto=z.infer<typeof updateAdminProfileSchema>;
export type updateJudgeProfileDto=z.infer<typeof updateJudgeProfileSchema>;
export type updateParticipantProfileDto=z.infer<typeof updateParticipantProfileSchema>;