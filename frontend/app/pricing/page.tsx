import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "per event",
    description: "Try PhotoFlow for a small gathering before your big event.",
    features: [
      "Up to 200 photos",
      "1 GB storage",
      "5 HD downloads included",
      "QR code guest access",
      "Face matching included",
    ],
    popular: false,
  },
  {
    name: "Starter",
    price: "₹999",
    period: "per event",
    description: "For intimate weddings, birthdays, and small celebrations.",
    features: [
      "Up to 1,000 photos",
      "5 GB storage",
      "50 HD downloads included",
      "QR code guest access",
      "Face matching included",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: "₹2,999",
    period: "per event",
    description: "Built for full-scale weddings and multi-day celebrations.",
    features: [
      "Up to 5,000 photos",
      "25 GB storage",
      "Unlimited HD downloads",
      "WhatsApp photo delivery",
      "Priority processing",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: "₹7,999",
    period: "per event",
    description: "For large weddings, conferences, and multi-photographer events.",
    features: [
      "Unlimited photos",
      "100 GB storage",
      "Unlimited HD downloads",
      "WhatsApp photo delivery",
      "Dedicated support",
    ],
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="bg-white">
      <SiteHeader />

      <section className="px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-ink">
          Pricing for every event
        </h1>
        <p className="mt-4 text-lg text-muted max-w-xl mx-auto">
          One simple price per event. No subscriptions, no surprises.
        </p>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="group relative rounded-2xl p-7 border border-hairline bg-white transition-all duration-300 hover:border-coral hover:bg-coral-tint hover:shadow-xl hover:-translate-y-1"
            >
              {/* Reserved space for the label -- always present so every
                  card has identical height, whether or not it's "popular" */}
              <p className="h-5 text-xs font-semibold text-coral uppercase tracking-wide mb-3">
                {plan.popular ? "Most popular" : ""}
              </p>

              <h3 className="text-xl font-bold text-ink">{plan.name}</h3>

              <p className="mt-2">
                <span className="text-3xl font-bold text-ink">{plan.price}</span>
                <span className="text-sm text-muted"> {plan.period}</span>
              </p>

              <p className="mt-3 text-sm text-muted leading-relaxed">
                {plan.description}
              </p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-ink"
                  >
                    <span className="text-coral mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/dashboard"
                className="focus-ring mt-7 block text-center rounded-full px-5 py-3 font-semibold border border-hairline text-ink bg-white transition-colors duration-300 group-hover:bg-coral group-hover:text-white group-hover:border-coral"
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 bg-coral-tint">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-4">
            Pay once per event — no recurring fees
          </h2>
          <p className="text-muted leading-relaxed">
            PhotoFlow is priced per event, not as a monthly subscription.
            Pick the plan that matches your guest count and photo volume,
            and your gallery stays live for guests to revisit afterward.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}