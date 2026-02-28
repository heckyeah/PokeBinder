import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { register } from "../actions/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl = "/", error: queryError } = await searchParams;

  async function registerAction(formData: FormData) {
    "use server";
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;
    const name = (formData.get("name") as string)?.trim();
    const redirectTo = (formData.get("callbackUrl") as string) || "/";

    const result = await register(email ?? "", password, name || undefined);
    if (!result.success) {
      redirect(
        `/register?error=${encodeURIComponent(result.error)}&callbackUrl=${encodeURIComponent(redirectTo)}`
      );
    }
    await signIn("credentials", {
      email: result.email,
      password: result.password,
      redirectTo,
    });
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-xl font-bold hover:underline">
            Pokemon Card Binder
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-lg font-semibold">Create an account</h1>
          {queryError && (
            <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-800">
              {decodeURIComponent(queryError)}
            </p>
          )}
          <form action={registerAction} className="flex flex-col gap-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-0.5 text-xs text-slate-500">At least 6 characters</p>
            </div>
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                Name (optional)
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create account
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-medium text-blue-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
