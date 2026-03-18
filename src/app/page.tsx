import { Show, SignIn } from "@clerk/nextjs";
import { DiscoveryForm } from "../components/discovery-form";

export default function HomePage() {
  return (
    <>
      <Show when="signed-out">
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,76,129,0.16),_transparent_30%),linear-gradient(180deg,#f7f8fb_0%,#edf2f7_100%)] px-4 py-10 md:px-8">
          <div className="mx-auto flex max-w-7xl justify-center">
            <SignIn fallbackRedirectUrl="/" path="/sign-in" routing="path" signUpUrl="/sign-up" />
          </div>
        </main>
      </Show>
      <Show when="signed-in">
        <DiscoveryForm />
      </Show>
    </>
  );
}
