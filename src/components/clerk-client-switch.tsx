"use client";

import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";

export function AuthSwitch({
  signedIn,
  signedOut
}: {
  signedIn: React.ReactNode;
  signedOut: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <>{signedOut}</>;
  }

  return isSignedIn ? <>{signedIn}</> : <>{signedOut}</>;
}

export function HeaderAuthControls() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  return isSignedIn ? (
    <UserButton />
  ) : (
    <>
      <SignInButton />
      <SignUpButton />
    </>
  );
}
