// src/lib/server/oauth.js
"use server";

import { createAdminCleint } from "@/lib/appwrite";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { OAuthProvider } from "node-appwrite";

export async function signUpWithGithub() {
	const { account } = await createAdminCleint();

  const origin = (await headers()).get("origin");

	const redirectUrl = await account.createOAuth2Token(
		OAuthProvider.Github,
		`${origin}/oauth`,
		`${origin}/sign-up`
	);

	return redirect(redirectUrl);
};
export async function signUpWithGoogle() {
	const { account } = await createAdminCleint();

  const origin = (await headers()).get("origin");

	const redirectUrl = await account.createOAuth2Token(
		OAuthProvider.Google,
		`${origin}/oauth`,
		`${origin}/sign-up`
	);

	return redirect(redirectUrl);
};
