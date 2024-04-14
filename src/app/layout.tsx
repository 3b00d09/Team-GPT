import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Conversations from "@/lib/components/conversations";
import "@fortawesome/fontawesome-svg-core/styles.css"
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="flex w-screen h-screen overflow-hidden text-white">
          <Conversations/>
          <div className="flex-1 bg-[#212121] p-4 flex flex-col relative">
            <p>GPT 4 Turbo</p>
            <Suspense fallback={<p>Loading...</p>}>
              {children}
            </Suspense>
          </div>
      </main>
      </body>
    </html>
  );
}
