import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { seedDefaultCategories } from "./seed";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        const existingUsers = await db.select().from(users).where(eq(users.email, user.email)).limit(1);

        let userId = user.id || "";
        if (existingUsers.length === 0) {
          const [newUser] = await db
            .insert(users)
            .values({
              id: user.id || crypto.randomUUID(),
              name: user.name || "Pengguna",
              email: user.email,
              image: user.image || null,
            })
            .returning();
          userId = newUser.id;
          await seedDefaultCategories(userId);
        } else {
          userId = existingUsers[0].id;
        }

        user.id = userId;
        return true;
      } catch (err) {
        console.error("Error pada callback signIn:", err);
        return true; // Tetap izinkan sign-in bila DB sedang offline saat development
      }
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
});
