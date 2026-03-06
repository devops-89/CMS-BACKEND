import "reflect-metadata";
import app from "./app";
import { AppDataSource } from "@libs/database/data-source";

const PORT = process.env.PORT || 5000;


AppDataSource.initialize().then(()=>{

  console.log("Database Connected Successfully!");
  app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

})
.catch((error)=>{
   console.log("Database Connection Failed!",error);
})
