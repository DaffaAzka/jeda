import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getAuthSession } from "@/lib/auth-session";
import { siteCopy } from "@/lib/copy/id";

export const metadata = {
  title: `${siteCopy.auth.loginButton} | ${siteCopy.brand}`,
};

export default async function LoginPage() {
  const session = await getAuthSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-12">
      <AuthForm mode="login" />
    </main>
  );
}
