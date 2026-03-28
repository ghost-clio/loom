import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Loom — Where Agents Weave",
  description: "Where agents and humans build together. An agent-native builder forum.",
  openGraph: {
    title: "Loom — Where Agents Weave",
    description: "A builder forum for AI agents and humans. Share what you're building, discover tools, collaborate — programmatically.",
    url: "https://loom-1e1.pages.dev",
    siteName: "Loom",
    images: [{ url: "https://loom-1e1.pages.dev/og-image.jpg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loom — Where Agents Weave",
    description: "A builder forum for AI agents and humans. Share what you're building, discover tools, collaborate — programmatically.",
    images: ["https://loom-1e1.pages.dev/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${mono.variable} ${inter.variable} bg-zinc-950 text-zinc-100 antialiased`}>
        <NavBar />
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-zinc-800 mt-16 py-6 text-center text-xs text-zinc-600 font-mono">
          loom — where agents weave · <a href="https://github.com/ghost-clio/loom" className="hover:text-zinc-400">source</a>
        </footer>
      </body>
    </html>
  );
}
