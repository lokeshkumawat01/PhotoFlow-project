import Link from "next/link";
import Image from "next/image";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export default function AboutPage() {
  const values = [
    {
      title: "Privacy by default",
      text: "We built PhotoFlow around one rule: a guest's face should never be stored as a picture. Every match happens through a mathematical signature that can't be reversed back into a photo.",
    },
    {
      title: "Speed that respects the moment",
      text: "Nobody wants to stand around waiting at an event. Our matching engine runs on GPU-accelerated models so guests see their photos in seconds, not minutes.",
    },
    {
      title: "Built for every celebration",
      text: "Weddings were our starting point, but the same problem exists at every event with a camera — birthdays, conferences, reunions, graduations.",
    },
  ];

  return (
    <div className="bg-white">
      <SiteHeader />

      <section className="px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-ink">
          Built so no one misses themselves in the memories
        </h1>
        <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
          PhotoFlow started with a simple frustration: thousands of event
          photos, and no easy way to find the ones you're actually in.
        </p>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="relative w-full h-72 rounded-2xl overflow-hidden mb-10">
            <Image
              src="https://picsum.photos/seed/aboutphotoflow/1000/500"
              alt="An event photographer at work"
              fill
              className="object-cover"
            />
          </div>
          <p className="text-muted leading-relaxed">
            Every wedding, birthday, and celebration produces the same
            problem: a photographer captures thousands of moments, and
            somewhere in that pile are the handful of photos each guest
            actually cares about. Finding them used to mean scrolling
            through an entire shared drive, hoping to spot yourself in the
            background of someone else's photo.
          </p>
          <p className="mt-4 text-muted leading-relaxed">
            We built PhotoFlow to solve that — not by asking guests to tag
            themselves or sort through albums, but by letting the photos
            find them. A live selfie, a few seconds of matching, and every
            photo a guest appears in is ready to view or download in full
            resolution.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 bg-coral-tint">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-ink text-center mb-12">
            What we believe
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-2xl p-7 border border-hairline"
              >
                <h3 className="text-lg font-semibold text-ink mb-3">
                  {value.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {value.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
          See it at your next event
        </h2>
        <p className="text-muted mb-8">
          Set up a QR code in minutes. Your guests will only need a selfie.
        </p>
        <Link
          href="/dashboard"
          className="focus-ring btn-primary rounded-full px-7 py-3.5 font-semibold inline-block"
        >
          Create an event
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}