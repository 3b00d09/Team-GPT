import Link from "next/link";

import { dbClient } from "@/lib/db/db";
import argon2 from "argon2";
import { cookies } from "next/headers";
import { lucia, validateRequest } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { AuthForm } from "@/lib/components/AuthForm";
import { generateId } from "lucia";
import { SqliteError } from "better-sqlite3";

import type { ActionResult } from "@/lib/components/AuthForm";
import { usersTable } from "@/lib/db/schema";

export default async function Page() {
  const { user } = await validateRequest();
  if (user) {
    return redirect("/");
  }
  return (
    <>
      <h1>Create an account</h1>
      <AuthForm action={signup}>
        <label htmlFor="username">Username</label>
        <input
          name="username"
          id="username"
          className="text-black p-2 rounded-md"
        />
        <label htmlFor="password">Password</label>
        <input
          type="password"
          name="password"
          id="password"
          className="text-black p-2 rounded-md"
        />
        <label htmlFor="repeat-password">Repeat Password</label>
        <input
          type="password"
          name="repeat-password"
          id="repeat-password"
          className="text-black p-2 rounded-md"
        />
        <label htmlFor="invite-token">Invite Token</label>
        <input
          type="password"
          name="invite-token"
          id="invite-token"
          className="text-black p-2 rounded-md"
        />
        <button className="p-2 rounded-md bg-secondary w-full mt-2">
          Register
        </button>
      </AuthForm>
      <Link href="/login" className="p-2 text-sm mt-2 text-center">
        Existing user? Login
      </Link>
    </>
  );
}

async function signup(_: any, formData: FormData): Promise<ActionResult> {
  "use server";
  const username = formData.get("username");
  // username must be between 4 ~ 31 characters, and only consists of lowercase letters, 0-9, -, and _
  // keep in mind some database (e.g. mysql) are case insensitive
  if (
    typeof username !== "string" ||
    username.length < 3 ||
    username.length > 31 ||
    !/^[a-z0-9_-]+$/.test(username)
  ) {
    return {
      error: "Invalid username",
    };
  }
  const password = formData.get("password");
  const passwordRepeat = formData.get("repeat-password");
  if (
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 255
  ) {
    return {
      error: "Invalid password",
    };
  }

  if (password !== passwordRepeat) {
    return {
      error: "Passwords do not match",
    };
  }

  const inviteToken = formData.get("invite-token");
  const INVITE_SECRET = process.env.INVITE_SECRET;

  if (inviteToken !== INVITE_SECRET) {
    return {
      error: "Invalid invite token",
    };
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id, // Use argon2id variant
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
  const userId = generateId(15);

  try {
    await dbClient.insert(usersTable).values({
        id: userId,
        username,
        password: passwordHash,
        });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
  } catch (e) {
    console.log(e)
    if (e instanceof SqliteError && e.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return {
        error: "Username already used",
      };
    }
    return {
      error: "An unknown error occurred",
    };
  }
  return redirect("/");
}
