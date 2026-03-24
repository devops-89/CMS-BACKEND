import { AppDataSource } from "@libs/database/data-source";

import { FormTemplate,FormSubmission } from "@libs/entities";

export class FormSubmissionRepository{
    private repo=AppDataSource.getRepository(FormSubmission);

    create(template: FormTemplate,data:Record<string,any>){
        return this.repo.create({template,data});
    }

    save(submission:FormSubmission){
        return this.repo.save(submission);
    }

    findByTemplate(templateId:string){
        return this.repo.find({
            where:{ template: {id:templateId}},
            relations:["template"],
            order:{createdAt:"DESC"}
        })
    }
}