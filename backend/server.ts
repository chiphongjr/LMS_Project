import dotenv from "dotenv";
import { connectDB } from "./utils/db";
import app from "./app";

dotenv.config();

app.listen(process.env.PORT, () => {
  console.log(`Server is running at ${process.env.PORT}`);
  connectDB();
});
