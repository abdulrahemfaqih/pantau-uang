import { auth } from "./auth";

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (err) {
    console.error("Gagal mendapatkan session pengguna:", err);
  }

  return null;
}
