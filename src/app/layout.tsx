import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { HeaderAuthControls } from "../components/clerk-client-switch";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ruxton Scope Clarification",
  description: "Ruxton Scope Clarification questionnaire for capturing project requirements, constraints, and phased delivery priorities."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <header className="border-b border-[var(--border)] bg-white/90 px-4 py-3 backdrop-blur md:px-8">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-3">
              <HeaderAuthControls />
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
