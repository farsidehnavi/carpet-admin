import Link from "next/link";
import { CubeIcon, PlusIcon } from "./icons";
import { LogoutButton } from "./LogoutButton";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-fg">
            <CubeIcon width={18} height={18} />
          </span>
          <span className="truncate">Catalog</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/products/new" className="btn btn-primary mr-1 hidden sm:inline-flex">
            <PlusIcon width={18} height={18} /> Add product
          </Link>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
