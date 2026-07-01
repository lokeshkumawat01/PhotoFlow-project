import Link from "next/link";
import { EVENT_TYPES } from "../lib/constants";

export default function SiteFooter() {
  return (
    <footer className="border-t border-hairline px-6 py-14">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10">
        <div>
          <p className="text-lg font-bold text-ink mb-3">
            Photo<span className="text-coral">Flow</span>
          </p>
          <p className="text-sm text-muted leading-relaxed">
            Find every photo you're in, from any event — without storing a
            single selfie.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink mb-3">Product</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/how-it-works" className="hover:text-coral transition-colors">How it works</Link></li>
            <li><Link href="/pricing" className="hover:text-coral transition-colors">Pricing</Link></li>
            <li><Link href="/dashboard" className="hover:text-coral transition-colors">Create an event</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink mb-3">Events</p>
          <ul className="space-y-2 text-sm text-muted">
            {EVENT_TYPES.map((event) => (
              <li key={event.slug}>
                <Link href={`/events/${event.slug}`} className="hover:text-coral transition-colors">
                  {event.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink mb-3">Company</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/about" className="hover:text-coral transition-colors">About</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-hairline text-sm text-muted">
        © 2026 PhotoFlow. Built for every event, every guest.
      </div>
    </footer>
  );
}