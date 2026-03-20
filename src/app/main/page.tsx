import { SignIn } from "@clerk/nextjs";
import { AuthSwitch } from "../../components/clerk-client-switch";
import { DiscoveryForm } from "../../components/discovery-form";

export default function MainScopePage() {
  return (
    <AuthSwitch
      signedIn={<DiscoveryForm />}
      signedOut={
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,76,129,0.16),_transparent_30%),linear-gradient(180deg,#f7f8fb_0%,#edf2f7_100%)] px-4 py-10 md:px-8">
          <div className="mx-auto flex max-w-7xl justify-center">
            <SignIn fallbackRedirectUrl="/verde" path="/sign-in" routing="path" signUpUrl="/sign-up" />
          </div>
        </main>
      }
    />
  );
}
