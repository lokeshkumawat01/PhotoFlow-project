import Link from "next/link";
import Image from "next/image";
import { EVENT_TYPES } from "@/app/lib/constants";

export default function SiteFooter() {
  return (
    <footer className="bg-[#0f0d0a] text-white">
      <div className="container-page py-16 sm:py-20 grid sm:grid-cols-2 md:grid-cols-4 gap-10 sm:gap-8">
        <div className="sm:col-span-2 md:col-span-1">
          <Image
            src="/logo.png"
            alt="PhotoFlow"
            width={160}
            height={40}
            className="w-auto h-8 mb-4"
          />
          <p className="text-sm text-white/60 leading-relaxed max-w-xs">
            Find every photo you're in, from any event — without storing a
            single selfie.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-white mb-4">Product</p>
          <ul className="space-y-2.5 text-sm text-white/60">
            <li><Link href="/how-it-works" className="hover:text-[var(--color-gold)] transition-colors">How it works</Link></li>
            <li><Link href="/pricing" className="hover:text-[var(--color-gold)] transition-colors">Pricing</Link></li>
            <li><Link href="/dashboard" className="hover:text-[var(--color-gold)] transition-colors">Create an event</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-white mb-4">Events</p>
          <ul className="space-y-2.5 text-sm text-white/60">
            {EVENT_TYPES.map((event) => (
              <li key={event.slug}>
                <Link href={`/events/${event.slug}`} className="hover:text-[var(--color-gold)] transition-colors">
                  {event.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-white mb-4">Company</p>
          <ul className="space-y-2.5 text-sm text-white/60">
            <li><Link href="/about" className="hover:text-[var(--color-gold)] transition-colors">About</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-6 text-sm text-white/40">
          © 2026 PhotoFlow. Built for every event, every guest.
        </div>
      </div>
    </footer>
  );
}