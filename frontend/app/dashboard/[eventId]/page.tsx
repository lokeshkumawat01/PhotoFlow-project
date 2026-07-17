"use client";

import { useState, useEffect, use } from "react";
import { isLoggedIn } from "../../lib/api";
import { useRouter } from "next/navigation";

import EventStatusBanner from "../../components/dashboard/EventStatusBanner";
import UploadPanel from "../../components/dashboard/UploadPanel";
import LiveSyncPanel from "../../components/dashboard/LiveSyncPanel";
import QrGenerator from "../../components/dashboard/QrGenerator";
import VipManager from "../../components/dashboard/VipManager";
import VideoAccessManager from "../../components/dashboard/VideoAccessManager";
import EventVideoLibrary from "../../components/dashboard/EventVideoLibrary";

export default function EventDashboardPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    setCheckingAuth(false);
  }, [router]);

  if (checkingAuth) return null;

  return (
    <div className="bg-white min-h-screen">
      <header className="border-b border-hairline px-6 h-16 flex items-center">
        <p className="text-xl font-bold text-ink">
          Photo<span className="text-coral">Flow</span>
        </p>
      </header>

      <EventStatusBanner eventId={eventId} />

      <div className="max-w-2xl mx-auto px-6 py-16">
        <UploadPanel eventId={eventId} />
        <LiveSyncPanel eventId={eventId} />
        <QrGenerator eventId={eventId} />
        <VipManager eventId={eventId} />
        <VideoAccessManager eventId={eventId} />
        <EventVideoLibrary eventId={eventId} />
      </div>
    </div>
  );
}
