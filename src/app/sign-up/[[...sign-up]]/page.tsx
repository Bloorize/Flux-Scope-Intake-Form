import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="app-themed-root px-4 py-10 md:px-8">
      <div className="app-hero-pattern" />
      <div className="app-content-layer mx-auto flex max-w-7xl justify-center">
        <SignUp fallbackRedirectUrl="/verde" path="/sign-up" routing="path" signInUrl="/sign-in" />
      </div>
    </main>
  );
}
