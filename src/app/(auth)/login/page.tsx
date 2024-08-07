import Link from "next/link";

import { dbClient } from "@/lib/db/db";
import argon2 from "argon2";
import { cookies } from "next/headers";
import { lucia, validateRequest } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { AuthForm } from "@/lib/components/AuthForm";

import type { userRow } from "@/lib/db/schemaTypes";
import type { ActionResult } from "@/lib/components/AuthForm";
import { usersTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function Page() {
  const { user } = await validateRequest();
  if (user) {
    return redirect("/");
  }
  return (
    <>
      <h1>Sign in</h1>
      <AuthForm action={login}>
        <label htmlFor="username">Username</label>
        <input className="text-black" name="username" id="username" />
        <br />
        <label htmlFor="password">Password</label>
        <input className="text-black" type="password" name="password" id="password" />
        <br />
        <button>Continue</button>
      </AuthForm>
      <Link href="/signup">Create an account</Link>
    </>
  );
}

async function login(_: any, formData: FormData): Promise<ActionResult> {
  "use server";
  const username = formData.get("username");
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
  if (
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 255
  ) {
    return {
      error: "Invalid password",
    };
  }

  
  const existingUser = await dbClient.query.usersTable.findFirst({where: eq(usersTable.username, username),}) as userRow | undefined;
  if (!existingUser) {
    return {
      error: "Incorrect username or password",
    };
  }

  const validPassword = await argon2.verify(existingUser.password, password);
  if (!validPassword) {
    // NOTE:
    // Returning immediately allows malicious actors to figure out valid usernames from response times,
    // allowing them to only focus on guessing passwords in brute-force attacks.
    // As a preventive measure, you may want to hash passwords even for invalid usernames.
    // However, valid usernames can be already be revealed with the signup page among other methods.
    // It will also be much more resource intensive.
    // Since protecting against this is non-trivial,
    // it is crucial your implementation is protected against brute-force attacks with login throttling, 2FA, etc.
    // If usernames are public, you can outright tell the user that the username is invalid.
    return {
      error: "Incorrect username or password",
    };
  }

  const session = await lucia.createSession(existingUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
  return redirect("/");
}
