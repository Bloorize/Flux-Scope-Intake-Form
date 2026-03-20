import { SignIn } from "@clerk/nextjs";
import { AuthSwitch } from "../../components/clerk-client-switch";
import { DiscoveryForm } from "../../components/discovery-form";

export default function MainScopePage() {
  return (
    <AuthSwitch
      signedIn={<DiscoveryForm />}
      signedOut={
        <main className="app-themed-root px-4 py-10 md:px-8">
          <div className="app-hero-pattern" />
          <div className="app-content-layer mx-auto flex max-w-7xl justify-center">
            <SignIn fallbackRedirectUrl="/verde" path="/sign-in" routing="path" signUpUrl="/sign-up" />
          </div>
        </main>
      }
    />
  );
}
