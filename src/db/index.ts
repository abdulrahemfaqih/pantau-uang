import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Enable WebSocket support in Node.js runtime for interactive transactions
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // If building or static checking without runtime DB, provide warning
  console.warn("DATABASE_URL is not set in environment variables");
}

const pool = new Pool({ connectionString: connectionString || "" });

export const db = drizzle({ client: pool, schema });

