"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

const VERDE_UNLOCK_KEY = "verde-password-unlocked";
const VERDE_PASSWORD = "heysage";

type PasswordGateProps = {
  children: ReactNode;
};

export function PasswordGate({ children }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (window.sessionStorage.getItem(VERDE_UNLOCK_KEY) === "true") {
      setUnlocked(true);
    }
  }, []);

  const handleUnlock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.trim() === VERDE_PASSWORD) {
      setUnlocked(true);
      setError(null);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(VERDE_UNLOCK_KEY, "true");
      }
      return;
    }
    setError("Incorrect password. Please try again.");
  };

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,76,129,0.16),_transparent_30%),linear-gradient(180deg,#f7f8fb_0%,#edf2f7_100%)] px-4 py-10 md:px-8">
      <div className="mx-auto flex max-w-lg justify-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Client Access</CardTitle>
            <CardDescription>Enter the password to open the Verde scope form.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleUnlock}>
              <Input
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                type="password"
                value={password}
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button className="w-full" type="submit">
                Unlock Form
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
