import Image from "next/image";
import Link from "next/link";
import ruxtonLogo from "../images/ruxton_logo_clear.png";

export default function HomePage() {
  return (
    <main className="landing-root min-h-screen overflow-hidden">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-4 pb-14 pt-2 md:px-8">
        <header className="landing-fade-up sticky top-2 z-20 mx-auto w-full max-w-6xl rounded-2xl bg-white/85 px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.05),0_14px_40px_rgba(16,24,40,0.12)] backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-16">
              <Link className="flex items-center" href="/">
                <Image
                  src={ruxtonLogo}
                  alt="Ruxton Labs"
                  width={160}
                  height={34}
                  className="h-7 w-auto origin-left scale-[1.8] object-contain"
                  priority
                />
              </Link>
              <nav className="hidden items-center gap-5 text-sm font-medium text-[#475569] md:flex">
                <a className="transition-colors hover:text-[#0f1723]" href="#product">
                  Product
                </a>
                <a className="transition-colors hover:text-[#0f1723]" href="#workflow">
                  Workflow
                </a>
                <a className="transition-colors hover:text-[#0f1723]" href="#outcomes">
                  Outcomes
                </a>
                <a className="transition-colors hover:text-[#0f1723]" href="#about">
                  Company
                </a>
                <a className="transition-colors hover:text-[#0f1723]" href="#pricing">
                  Pricing
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Link className="landing-button-secondary inline-flex h-9 items-center justify-center px-4 text-xs font-semibold" href="/sign-in">
                Sign in
              </Link>
              <Link className="landing-button-primary inline-flex h-9 items-center justify-center px-4 text-xs font-semibold" href="/sign-up">
                Sign up
              </Link>
              <Link className="px-1 py-2 text-sm font-semibold text-[#0f1723] underline decoration-[#94a3b8] underline-offset-4" href="/start-scope-form">
                Start scope form
              </Link>
            </div>
          </div>
        </header>

        <section className="relative flex min-h-[56vh] items-center justify-center px-4 pt-4 md:px-6 md:pt-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-55"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 18%, rgba(125,94,255,0.18), transparent 34%), linear-gradient(rgba(15,23,35,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,35,0.06) 1px, transparent 1px)",
              backgroundSize: "100% 100%, 120px 120px, 120px 120px",
              backgroundPosition: "center, center, center"
            }}
          />
          <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
            <div className="landing-fade-up-delay-1 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#6366f1] shadow-[0_10px_24px_rgba(37,99,235,0.14)]">
              Flux by Ruxton Labs
            </div>
            <h1 className="landing-fade-up-delay-2 mt-6 text-balance text-4xl font-semibold tracking-[-0.03em] text-[#0b1220] md:text-7xl">
              Define it. Track it. Protect it.
            </h1>
            <p className="landing-fade-up-delay-2 mt-6 max-w-3xl text-balance text-lg leading-8 text-[#475569] md:text-2xl md:leading-10">
              Flux is the always-on desktop companion for agencies and consultancies that need tighter scope control, faster client decisions, and stronger project margins.
            </p>
            <div className="landing-fade-up-delay-3 mt-8 flex flex-wrap justify-center gap-3">
              <Link className="landing-button-secondary inline-flex h-12 items-center justify-center px-6 text-sm font-semibold" href="/sign-in">
                Sign in
              </Link>
              <Link className="landing-button-primary inline-flex h-12 items-center justify-center px-6 text-sm font-semibold" href="/start-scope-form">
                Open Scope Form
              </Link>
            </div>
          </div>
        </section>

        <section id="product" className="landing-fade-up-delay-2 mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-3">
          <article className="landing-card p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Capture</h2>
            <p className="mt-3 text-sm leading-7 text-[#334155]">
              Pull scope signals from calls, email, Slack, and quick notes into one queue before they become invisible delivery work.
            </p>
          </article>
          <article className="landing-card p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Analyze</h2>
            <p className="mt-3 text-sm leading-7 text-[#334155]">
              Compare every request to baseline scope, estimate cost and timeline impact, and route the right next action with AI guidance.
            </p>
          </article>
          <article className="landing-card p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Protect</h2>
            <p className="mt-3 text-sm leading-7 text-[#334155]">
              Lock in approvals, keep version history, and sync approved changes back to Jira or Asana so delivery stays aligned.
            </p>
          </article>
        </section>

        <section id="workflow" className="landing-fade-up-delay-3 mx-auto mt-8 w-full max-w-6xl rounded-3xl bg-[linear-gradient(135deg,#0c1322_0%,#111f3d_50%,#312e81_100%)] px-8 py-10 text-white shadow-[0_28px_80px_rgba(15,23,35,0.35)] md:px-10 md:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">How it works</p>
          <h2 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-tight md:text-4xl">From first scope session to signed change orders.</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-white/10 p-4 text-sm leading-7 text-white/85">
              Build a structured baseline with deliverables, assumptions, exclusions, risks, and phased milestones.
            </div>
            <div className="rounded-xl bg-white/10 p-4 text-sm leading-7 text-white/85">
              Capture changes from meetings, messages, and email before they leak into delivery.
            </div>
            <div className="rounded-xl bg-white/10 p-4 text-sm leading-7 text-white/85">
              Send clients clean approval requests with full cost and timeline context in seconds.
            </div>
            <div className="rounded-xl bg-white/10 p-4 text-sm leading-7 text-white/85">
              Generate updated SOWs and sync approved scope to Jira and Asana with clear traceability.
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto mt-8 w-full max-w-6xl py-4 text-center text-sm leading-7 text-[#526175]">
          Built by Ruxton Labs for fixed-price delivery teams that are done losing margin to unclear scope and informal approvals.
        </section>

        <section id="outcomes" className="mx-auto mt-4 grid w-full max-w-6xl gap-4 md:grid-cols-3">
          <article className="landing-card p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Margin protection</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[#0f1723]">10-30%</p>
            <p className="mt-1 text-sm leading-7 text-[#334155]">Typical margin at risk from scope creep that Flux helps surface and control.</p>
          </article>
          <article className="landing-card p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Approval speed</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[#0f1723]">30 sec</p>
            <p className="mt-1 text-sm leading-7 text-[#334155]">Client portal decisions with simple approve, decline, or comment actions.</p>
          </article>
          <article className="landing-card p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Single source of truth</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[#0f1723]">Versioned</p>
            <p className="mt-1 text-sm leading-7 text-[#334155]">Every scope decision is logged with owner, rationale, and timeline impact.</p>
          </article>
        </section>

        <section id="pricing" className="mx-auto mt-6 w-full max-w-6xl rounded-3xl bg-[linear-gradient(135deg,#0b1630_0%,#1a2a52_44%,#4f46e5_100%)] px-8 py-10 text-center text-white md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Get started</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Start your Flux scope workspace today</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/85">
            Create an account, invite your team, and move into the guided scope clarification workflow in minutes.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link className="landing-button-secondary inline-flex h-11 items-center justify-center px-5 text-sm font-semibold" href="/sign-in">
              Sign in
            </Link>
            <Link className="landing-button-primary inline-flex h-11 items-center justify-center px-5 text-sm font-semibold" href="/start-scope-form">
              Open Scope Form
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
