import app from "./app";
import dotenv from "dotenv";
import { connectDB } from "./configs/database";

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(
      `Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`,
    );
  });
};

start();
