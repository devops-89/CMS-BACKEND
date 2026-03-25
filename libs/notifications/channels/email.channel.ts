import {resend} from "../resend.client";
import {render} from "@react-email/render";

import React from "react";

export class EmailChannel{
     async send(to:string, subject:string, template:React.ReactElement){
        const html=await render(template);

        await resend.emails.send({
            from:"onboarding@resend.dev",
            to:[to],
            subject,
            html
        });

     }
}
