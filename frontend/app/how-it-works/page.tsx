import Image from "next/image";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export default function HowItWorksPage() {
  const guestSteps = [
    {
      step: "1",
      title: "Scan the QR code",
      text: "A quick scan of the event QR code — or a tap on the private link — opens the camera right in the browser. No app to download.",
      image: "https://picsum.photos/seed/qrcode/600/400",
    },
    {
      step: "2",
      title: "Take a live selfie",
      text: "Guests take a real-time selfie on the page. We never accept uploaded photos for matching, so no one can search using someone else's picture.",
      image: "https://picsum.photos/seed/selfie/600/400",
    },
    {
      step: "3",
      title: "See only their photos",
      text: "In seconds, every photo that guest appears in is matched and shown — nothing else from the album is visible to them.",
      image: "https://picsum.photos/seed/gallery/600/400",
    },
  ];

  const organizerSteps = [
    {
      title: "Create your event",
      text: "Add your event name and date. You'll instantly get a private QR code and a guest link, ready to share or print.",
    },
    {
      title: "Upload the full album",
      text: "Drop in the entire photo album as a ZIP — thousands of photos at once. PhotoFlow compresses and indexes every face automatically in the background.",
    },
    {
      title: "Share the QR code",
      text: "Display the QR code at your venue, or send the link digitally. Every guest who scans it can find their own photos instantly.",
    },
  ];

  return (
    <div className="bg-white">
      <SiteHeader />

      <section className="px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-ink">How It Works</h1>
        <p className="mt-4 text-lg text-muted max-w-xl mx-auto">
          We instantly create a private QR code for your event that delivers
          full-resolution, face-matched photos straight to every guest.
        </p>
      </section>

      <section className="px-6 py-16 bg-coral-tint">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-ink text-center mb-12">
            How it works for guests
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {guestSteps.map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-2xl overflow-hidden border border-hairline"
              >
                <div className="relative w-full h-44">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-7">
                  <div className="w-10 h-10 rounded-full bg-coral text-white font-bold flex items-center justify-center mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-ink text-center mb-12">
            How it works for organizers
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {organizerSteps.map((item) => (
              <div
                key={item.title}
                className="lift-on-hover rounded-2xl border border-hairline p-7"
              >
                <h3 className="text-lg font-semibold text-ink mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 bg-coral-tint">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-4">
            Built with privacy as a first principle
          </h2>
          <p className="text-muted leading-relaxed max-w-2xl mx-auto">
            PhotoFlow never stores a guest's selfie. The moment a selfie is
            captured, it is converted into a mathematical signature — a
            string of numbers that can identify a match but can never be
            turned back into a photo. The original picture is discarded
            immediately. Full-resolution downloads are only ever generated
            for photos a guest has already been matched to.
          </p>
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
          Ready to set up your event?
        </h2>
        <Link
          href="/dashboard"
          className="focus-ring btn-primary rounded-full px-7 py-3.5 font-semibold inline-block mt-4"
        >
          Create an event
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}