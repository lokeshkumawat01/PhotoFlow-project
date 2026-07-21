import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import PageLoader from "./components/PageLoader";
import LenisProvider from "./components/LenisProvider";
import GlobalScene from "./components/GlobalScene";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PhotoFlow — Find your photos from any event",
  description: "Take a selfie. We'll find every photo you're in — from any event.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${spaceGrotesk.variable} antialiased`}>
        <PageLoader />
        {/*
          GlobalScene replaces the old per-section LivingBackground (Phase 1,
          Creative Direction §6): ONE continuous background, mounted once,
          that every scene registers with via useSceneTransition instead of
          each section mounting its own independent animated background.
        */}
        <LenisProvider>
          <GlobalScene>{children}</GlobalScene>
        </LenisProvider>
      </body>
    </html>
  );
}
