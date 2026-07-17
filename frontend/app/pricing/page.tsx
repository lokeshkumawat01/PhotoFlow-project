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
    <div style={{ background: "#FAFAF8" }}>
      <SiteHeader />

      <section className="px-6 pt-24 pb-16 text-center">
        <p
          className="text-xs font-semibold uppercase tracking-[0.15em] mb-4"
          style={{ color: "#C89B63" }}
        >
          Pricing
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold"
          style={{ color: "#161616", letterSpacing: "-0.02em" }}
        >
          Pricing for every event
        </h1>
        <p className="mt-4 text-lg max-w-xl mx-auto" style={{ color: "#666666" }}>
          One simple price per event. No subscriptions, no surprises.
        </p>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="group relative rounded-[28px] p-7 transition-all duration-300 hover:-translate-y-1.5"
              style={
                plan.popular
                  ? {
                      background: "#202020",
                      boxShadow: "0 20px 50px -12px rgba(0,0,0,0.35)",
                    }
                  : {
                      background: "rgba(255,255,255,0.75)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(0,0,0,0.06)",
                      boxShadow: "0 4px 24px -8px rgba(0,0,0,0.06)",
                    }
              }
            >
              {plan.popular && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap"
                  style={{ background: "#C89B63", color: "#161616" }}
                >
                  Most popular
                </span>
              )}
              {!plan.popular && <div className="h-5 mb-3" />}

              <h3
                className="text-xl font-bold mt-2"
                style={{ color: plan.popular ? "#FAFAF8" : "#161616" }}
              >
                {plan.name}
              </h3>

              <p className="mt-2">
                <span
                  className="text-3xl font-bold"
                  style={{ color: plan.popular ? "#ffffff" : "#161616" }}
                >
                  {plan.price}
                </span>
                <span
                  className="text-sm ml-1"
                  style={{ color: plan.popular ? "rgba(255,255,255,0.55)" : "#666666" }}
                >
                  {plan.period}
                </span>
              </p>

              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: plan.popular ? "rgba(255,255,255,0.65)" : "#666666" }}
              >
                {plan.description}
              </p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm"
                    style={{ color: plan.popular ? "rgba(255,255,255,0.9)" : "#161616" }}
                  >
                    <span className="mt-0.5" style={{ color: "#C89B63" }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/dashboard"
                className="focus-ring mt-7 block text-center rounded-full px-5 py-3.5 font-semibold transition-all duration-300"
                style={
                  plan.popular
                    ? { background: "#C89B63", color: "#161616" }
                    : { background: "transparent", color: "#161616", border: "1px solid rgba(0,0,0,0.12)" }
                }
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20" style={{ background: "#F5F5F3" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: "#161616" }}>
            Pay once per event — no recurring fees
          </h2>
          <p className="leading-relaxed" style={{ color: "#666666" }}>
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