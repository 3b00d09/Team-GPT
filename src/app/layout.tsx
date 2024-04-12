import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
        <div className="w-[10%] bg-[#171717] flex justify-between items-start p-4">
          <p>New Chat</p>
          <a href="/chat">+</a>
        </div>
        <div className="flex-1 bg-[#212121] p-4 flex flex-col">
          <p>GPT 4 Turbo</p>
            {children}
        </div>
      </main>
      </body>
    </html>
  );
}
