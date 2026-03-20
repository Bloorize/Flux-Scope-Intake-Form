import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="app-themed-root px-4 py-10 md:px-8">
      <div className="app-hero-pattern" />
      <div className="app-content-layer mx-auto flex max-w-7xl justify-center">
        <SignIn fallbackRedirectUrl="/verde" path="/sign-in" routing="path" signUpUrl="/sign-up" />
      </div>
    </main>
  );
}
