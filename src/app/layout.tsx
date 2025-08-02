import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/query-provider";
import { Providers } from "./provider";
const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = {
  title: "Planzo",
  description: "Planzo - Your Ultimate Project Management Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(inter.className, "antialiased min-h-screen")}
      >
        <Providers>
        <QueryProvider>
          <Toaster />
          {children}
        </QueryProvider>
        </Providers>
      </body>
    </html>
  );
}
