import { createClient } from "@supabase/supabase-js";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

console.log("[Auth] Supabase URL configured:", !!supabaseUrl, "Key configured:", !!supabaseServiceKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const authHeader = opts.req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !supabaseUser) {
        return { req: opts.req, res: opts.res, user: null };
      }

      // Map Supabase user to MySQL user (using openId = supabase user id)
      let dbUser = await db.getUserByOpenId(supabaseUser.id);

      if (!dbUser) {
        // Auto-create user on first login
        await db.upsertUser({
          openId: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
          email: supabaseUser.email ?? null,
          loginMethod: supabaseUser.app_metadata?.provider ?? "google",
          lastSignedIn: new Date(),
        });
        dbUser = await db.getUserByOpenId(supabaseUser.id);
      } else {
        await db.upsertUser({
          openId: dbUser.openId,
          lastSignedIn: new Date(),
        });
      }

      user = dbUser ?? null;
    }
  } catch (error) {
    console.error("[Auth] Context creation failed:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
