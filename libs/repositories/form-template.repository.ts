import { partial } from "zod/mini";
import {AppDataSource} from  "../database/data-source";
import { FormTemplate } from "@libs/entities/form-template.entity";

export class FormTemplateRepository{
    private repo= AppDataSource.getRepository(FormTemplate);

    create(payload: Partial<FormTemplate>){
         return this.repo.create(payload);
    }

    save(template:FormTemplate){
        return this.repo.save(template);

    }

    findAll(){
        return this.repo.find({
            where:{isActive:true},
            order:{createdAt:"DESC"}
        })
    }

      findById(id: string): Promise<FormTemplate | null> {
    return this.repo.findOne({
      where: { id }
    });
  }

  // update the template
  async update(id:string,payload:Partial<FormTemplate>){
    await this.repo.update({id},payload);
    return this.findById(id);
  }

  // Delete the Template
  async delete(id:string){
    return this.repo.delete({id});
  }

   
  
}

