"use server";

import bcrypt from "bcryptjs";
import { signOut } from "@/auth";
import { sanityClientWithToken } from "@/lib/sanity/client";
import { userByEmailQuery } from "@/lib/sanity/queries";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function register(
  email: string,
  password: string,
  name?: string
): Promise<
  | { success: true; email: string; password: string }
  | { success: false; error: string }
> {
  const trimmedEmail = email?.trim().toLowerCase();
  if (!trimmedEmail || !password || password.length < 6) {
    return { success: false, error: "Email and password (min 6 characters) are required." };
  }

  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
    return { success: false, error: "Server configuration error." };
  }

  const existing = await sanityClientWithToken.fetch<{ _id: string } | null>(userByEmailQuery, {
    email: trimmedEmail,
  });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  try {
    await sanityClientWithToken.createOrReplace({
      _type: "user",
      _id: userId,
      email: trimmedEmail,
      hashedPassword,
      name: name?.trim() || undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create account";
    return { success: false, error: message };
  }

  return { success: true as const, email: trimmedEmail, password };
}
