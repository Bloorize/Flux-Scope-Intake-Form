import type { Metadata } from "next";
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enterprise Discovery Form",
  description: "Structured discovery workflow for enterprise operations platform scoping and LOE estimation."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <header className="border-b border-[var(--border)] bg-white/90 px-4 py-3 backdrop-blur md:px-8">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-3">
              <Show when="signed-out">
                <SignInButton />
                <SignUpButton />
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
