"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { LogOutIcon } from "./icons";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    try {
      await api("/api/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button type="button" onClick={logout} className="icon-btn" aria-label="Sign out" title="Sign out">
      <LogOutIcon />
    </button>
  );
}
