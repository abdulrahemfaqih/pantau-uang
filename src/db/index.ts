import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // If building or static checking without runtime DB, provide warning
  console.warn("DATABASE_URL is not set in environment variables");
}

const sql = neon(connectionString || "");

export const db = drizzle(sql, { schema });
