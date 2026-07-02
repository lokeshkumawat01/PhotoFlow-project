"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { authFetch, isLoggedIn } from "../lib/api";

export default function DashboardCreatePage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Organizer must be logged in to create an event -- the backend
    // derives `organizer` from the JWT token, not from a form field.
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    setCheckingAuth(false);
  }, [router]);

  async function handleCreateEvent() {
    if (!eventName || !eventDate) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await authFetch("/api/events/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_name: eventName,
          event_date: eventDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Could not create the event.");
        setLoading(false);
        return;
      }

      router.push(`/dashboard/${data.event_id}`);
    } catch (err) {
      setErrorMessage("Could not connect to the server.");
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return null;
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <SiteHeader />

      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-hairline p-8">
            <h1 className="text-2xl font-bold text-ink">Create a new event</h1>
            <p className="text-muted mt-1 mb-8 text-sm">
              Set up your event to start uploading photos and generate a guest QR code.
            </p>

            <label className="block text-sm font-medium text-ink mb-1">
              Event name
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Priya & Raj Wedding"
              className="focus-ring w-full rounded-lg border border-hairline px-3 py-2.5 text-sm outline-none"
            />

            <label className="block text-sm font-medium text-ink mt-4 mb-1">
              Event date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="focus-ring w-full rounded-lg border border-hairline px-3 py-2.5 text-sm outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleCreateEvent()}
            />

            {errorMessage && (
              <p className="text-coral-dark text-sm mt-3">{errorMessage}</p>
            )}

            <button
              onClick={handleCreateEvent}
              disabled={loading}
              className="focus-ring btn-primary mt-6 w-full rounded-full px-5 py-3 font-semibold disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create event"}
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}