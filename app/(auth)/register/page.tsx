import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getAuthSession } from "@/lib/auth-session";
import { siteCopy } from "@/lib/copy/id";

export const metadata = {
  title: `${siteCopy.auth.registerButton} | ${siteCopy.brand}`,
};

export default function RegisterRoutePage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}

async function RegisterContent() {
  const session = await getAuthSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-12">
      <AuthForm mode="register" />
    </main>
  );
}
