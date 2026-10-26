import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white text-zinc-950">
      <Card className="w-full max-w-sm p-6 sm:p-8 space-y-6 border border-zinc-200 shadow-none">
        <CardHeader className="p-0 text-center space-y-2">
          <div className="mx-auto h-10 w-10 rounded-md bg-zinc-950 text-white flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-zinc-950">
            PantauUang
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Pencatatan keuangan pribadi cepat, bersih, dan fungsional.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 space-y-4">
          <LoginForm />

          <p className="text-[11px] text-zinc-400 text-center">
            Dengan masuk, Anda menyetujui ketentuan penggunaan PantauUang.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
