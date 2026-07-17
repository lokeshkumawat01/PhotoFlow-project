"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../lib/api";

interface EventStatus {
  is_expired: boolean;
  days_until_deletion: number | null;
  warning_message: string | null;
}

/**
 * Shows the "event expired / about to be deleted" warning banner.
 * Extracted from dashboard/[eventId]/page.tsx.
 */
export default function EventStatusBanner({ eventId }: { eventId: string }) {
  const [eventStatus, setEventStatus] = useState<EventStatus | null>(null);

  useEffect(() => {
    async function loadEventStatus() {
      try {
        const res = await authFetch(`/api/events/${eventId}/status/`);
        if (!res.ok) return;
        setEventStatus(await res.json());
      } catch {
        // Silently ignore -- banner just won't show
      }
    }
    loadEventStatus();
  }, [eventId]);

  if (!eventStatus?.is_expired) return null;

  return (
    <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-center">
      <p className="text-sm font-medium text-red-700">{eventStatus.warning_message}</p>
    </div>
  );
}
