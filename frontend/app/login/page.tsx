"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { loginRequest } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin() {
    if (!username || !password) {
      setErrorMessage("Please enter your username and password.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await loginRequest(username, password);
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Could not log in. Please try again.");
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
            <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
            <p className="text-muted mt-1 mb-8 text-sm">
              Log in to manage your events and photo albums.
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
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />

            <label className="block text-sm font-medium text-ink mt-4 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="focus-ring w-full rounded-lg border border-hairline px-3 py-2.5 text-sm outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />

            {errorMessage && (
              <p className="text-coral-dark text-sm mt-3">{errorMessage}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="focus-ring btn-primary mt-6 w-full rounded-full px-5 py-3 font-semibold disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>

            <p className="text-sm text-muted mt-6 text-center">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-coral font-semibold hover:text-coral-dark">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}