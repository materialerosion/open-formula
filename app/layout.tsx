import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "react-hot-toast";
import ReactQueryProvider from "@/app/react-query-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import SessionProviderWrapper from "@/components/session-provider-wrapper";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Open Artifacts",
  description: "Create and Share Artifacts with Claude and other models",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={cn("min-h-screen font-sans antialiased", fontSans.variable)}>
        <SessionProviderWrapper session={session}>
          <ReactQueryProvider>
            {children}
            <Toaster />
          </ReactQueryProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
