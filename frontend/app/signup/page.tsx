"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { registerRequest, loginRequest } from "../lib/api";

export default function SignupPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSignup() {
    if (!username || !password) {
      setErrorMessage("Username and password are required.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await registerRequest(username, email, password);
      // Automatically log the organizer in right after account creation,
      // so they land straight in the dashboard instead of a second form.
      await loginRequest(username, password);
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Could not create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <SiteHeader />

      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-hairline p-8">
            <h1 className="text-2xl font-bold text-ink">Create your account</h1>
            <p className="text-muted mt-1 mb-8 text-sm">
              Set up events, upload albums, and share guest access in minutes.
            </p>

            <label className="block text-sm font-medium text-ink mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. sharma_photography"
              className="focus-ring w-full rounded-lg border border-hairline px-3 py-2.5 text-sm outline-none"
            />

            <label className="block text-sm font-medium text-ink mt-4 mb-1">
              Email <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="focus-ring w-full rounded-lg border border-hairline px-3 py-2.5 text-sm outline-none"
            />

            <label className="block text-sm font-medium text-ink mt-4 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="focus-ring w-full rounded-lg border border-hairline px-3 py-2.5 text-sm outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            />

            {errorMessage && (
              <p className="text-coral-dark text-sm mt-3">{errorMessage}</p>
            )}

            <button
              onClick={handleSignup}
              disabled={loading}
              className="focus-ring btn-primary mt-6 w-full rounded-full px-5 py-3 font-semibold disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            <p className="text-sm text-muted mt-6 text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-coral font-semibold hover:text-coral-dark">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}