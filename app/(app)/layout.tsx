import { AppHeader } from "@/components/AppHeader";
import { requireLogin } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireLogin();
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pt-8">{children}</main>
    </>
  );
}
