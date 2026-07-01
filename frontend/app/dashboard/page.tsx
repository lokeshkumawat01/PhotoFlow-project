"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function DashboardCreatePage() {
  const router = useRouter();

  const [organizerName, setOrganizerName] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCreateEvent() {
    if (!organizerName || !eventName || !eventDate) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/events/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizer_name: organizerName,
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

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900">Create a New Event</h1>
      <p className="text-gray-500 mt-1 mb-6">
        Set up your event to start uploading photos and generate a guest QR code.
      </p>

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Your Name
      </label>
      <input
        type="text"
        value={organizerName}
        onChange={(e) => setOrganizerName(e.target.value)}
        placeholder="e.g. Sharma Photography"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Event Name
      </label>
      <input
        type="text"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
        placeholder="e.g. Priya & Raj Wedding"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Event Date
      </label>
      <input
        type="date"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {errorMessage && (
        <p className="text-red-600 text-sm mt-3">{errorMessage}</p>
      )}

      <button
        onClick={handleCreateEvent}
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
      >
        {loading ? "Creating..." : "Create Event"}
      </button>
    </div>
  );
}