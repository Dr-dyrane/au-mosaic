"use server";

import { redirect } from "next/navigation";
import { checkPassword, clearSession, setSession } from "@/lib/admin-auth";

export async function login(_prev: { error: string } | null, form: FormData) {
  const password = String(form.get("password") ?? "");
  if (!checkPassword(password)) {
    return { error: "That is not the key to this house." };
  }
  await setSession();
  redirect("/admin");
}

export async function logout() {
  await clearSession();
  redirect("/admin/login");
}
