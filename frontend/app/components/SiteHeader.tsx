"use client";

import Link from "next/link";
import { useState } from "react";
import { EVENT_TYPES } from "../lib/constants";

export default function SiteHeader() {
  const [eventsOpen, setEventsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-hairline">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-ink">
          Photo<span className="text-coral">Flow</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-muted font-medium">
          <div
            className="relative"
            onMouseEnter={() => setEventsOpen(true)}
            onMouseLeave={() => setEventsOpen(false)}
          >
            <button className="hover:text-coral transition-colors">
              Events
            </button>
            {eventsOpen && (
              <div className="absolute top-full left-0 pt-2 w-48">
                <div className="rounded-xl border border-hairline bg-white shadow-lg p-2">
                  {EVENT_TYPES.map((event) => (
                    <Link
                      key={event.slug}
                      href={`/events/${event.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-coral-tint transition-colors"
                    >
                      {event.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link href="/how-it-works" className="hover:text-coral transition-colors">
            How it works
          </Link>
          <Link href="/pricing" className="hover:text-coral transition-colors">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-coral transition-colors">
            About
          </Link>
        </nav>

        <Link
          href="/dashboard"
          className="focus-ring btn-primary rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          Create an event
        </Link>
      </div>
    </header>
  );
}
