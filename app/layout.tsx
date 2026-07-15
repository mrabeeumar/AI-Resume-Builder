import type { Metadata } from "next";
import { Figtree, JetBrains_Mono, Sora } from "next/font/google";

import { AiJobsProvider } from "@/components/providers/ai-jobs-provider";
import { ThemedToaster } from "@/components/providers/themed-toaster";
import "./globals.css";

// Runs before hydration to apply the stored (or system) theme, preventing a
// flash of the wrong theme on first paint.
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}var r=document.documentElement;r.classList.toggle("dark",t==="dark");r.style.colorScheme=t;}catch(e){}})();`;

const fontSans = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontHeading = Sora({
  variable: "--font-heading",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  weight: ["500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ResoVo",
  description: "Build ATS-optimized resumes with AI assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontHeading.variable} ${fontMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <AiJobsProvider>
          {children}
          <ThemedToaster />
        </AiJobsProvider>
      </body>
    </html>
  );
}
