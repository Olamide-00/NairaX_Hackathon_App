import { cleanEnv, str, url } from "envalid";

// Validated once at startup — throws immediately if anything is missing/wrong.
export const env = cleanEnv(process.env, {
  NOMBA_BASE_URL: url({ desc: "Base URL for the Nomba API" }),
  NOMBA_SECRET_KEY: str({ desc: "Bearer token for the Nomba API" }),
  MONGODB_URI: str({ desc: "MongoDB connection string" }),
  NODE_ENV: str({
    choices: ["development", "test", "production"],
    default: "development",
  }),
});
