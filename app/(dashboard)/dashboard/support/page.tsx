import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { getSupportResources } from "@/features/support/queries";
import { SupportDirectory } from "@/features/support/components/support-directory";
import { siteCopy } from "@/lib/copy/id";

export const metadata = {
  title: `Bantuan & Layanan Pendukung | ${siteCopy.brand}`,
};

export default async function SupportPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const resources = await getSupportResources();

  return (
    <main className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12">
      <div className="mx-auto max-w-4xl">
        <SupportDirectory resources={resources} />
      </div>
    </main>
  );
}
