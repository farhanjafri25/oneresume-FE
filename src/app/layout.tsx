import type { Metadata } from "next";
import { Geist, Hubot_Sans } from "next/font/google";
import Script from "next/script";
import MotionProvider from "@/components/motion/MotionProvider";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-body" });

const hubotSans = Hubot_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "OneCV - The Last Resume Link You'll Ever Need",
  description: "Share one link, update everywhere, and track every view with OneCV.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.className} ${geist.variable} ${hubotSans.variable}`}>
      <body>
        <MotionProvider>{children}</MotionProvider>
        <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-K51N0E3HE1"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-K51N0E3HE1');
          `}
        </Script>
      </body>
    </html>
  );
}
