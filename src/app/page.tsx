import Image from "next/image";
import Link from "next/link";
import ruxtonLogo from "../images/ruxton_logo2.png";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,76,129,0.16),_transparent_28%),linear-gradient(180deg,#f7f8fb_0%,#edf2f7_100%)] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-8 shadow-sm md:p-12">
          <div className="space-y-6">
            <Image src={ruxtonLogo} alt="Ruxton Labs" width={300} height={64} className="h-14 w-auto object-contain" priority />
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)] md:text-5xl">
              Flux: precise project scoping, protected margins, stronger client alignment.
            </h1>
            <p className="max-w-4xl text-base leading-8 text-[var(--muted-foreground)]">
              Ruxton Labs leverages AI and custom operational tooling to define scope clearly from day one, track scope changes across meetings, email,
              and chat, and convert ambiguous requests into auditable approvals with measurable delivery impact.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--accent)] px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                href="/sign-in"
              >
                Sign in to continue
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-white px-5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                href="/sign-up"
              >
                Create account
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-white px-5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                href="/main"
              >
                Open scope form
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">The challenge</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
              Scope creep often erodes 10-30% of project margin because initial scope is vague, changes happen informally, and approval trails are incomplete.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">The system</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
              Flux combines collaborative scope definition, AI-based change analysis, versioned scope history, and stakeholder approvals in one flow.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">The outcome</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
              Teams protect delivery commitments, maintain clean PM-tool sync, and preserve profitability with clear in-scope versus out-of-scope decisions.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white p-8 md:p-10">
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">How Ruxton scopes with AI</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-[var(--muted)] p-4 text-sm leading-7 text-[var(--foreground)]">
              <p className="font-semibold">1. Define baseline scope</p>
              <p>Create structured launch scope, assumptions, exclusions, risks, and phased milestones with collaborative intake.</p>
            </div>
            <div className="rounded-xl bg-[var(--muted)] p-4 text-sm leading-7 text-[var(--foreground)]">
              <p className="font-semibold">2. Capture scope signals everywhere</p>
              <p>Ingest meeting notes, recordings, email, and chat so no request is lost or approved informally.</p>
            </div>
            <div className="rounded-xl bg-[var(--muted)] p-4 text-sm leading-7 text-[var(--foreground)]">
              <p className="font-semibold">3. Analyze impact in context</p>
              <p>AI compares each change to baseline scope, estimates timeline/cost impact, and recommends action paths.</p>
            </div>
            <div className="rounded-xl bg-[var(--muted)] p-4 text-sm leading-7 text-[var(--foreground)]">
              <p className="font-semibold">4. Lock approvals and synchronize delivery</p>
              <p>Track version history, generate change orders/SOW updates, and keep Jira/Asana execution aligned to approved scope.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--ink)] px-8 py-10 text-white md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Flux</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Define it. Track it. Protect it.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/80">
            Built for agencies and consultancies that need disciplined scoping, faster approvals, and stronger margin protection without replacing their
            existing project management systems.
          </p>
          <div className="mt-6">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-white px-5 text-sm font-medium text-[var(--ink)] transition-opacity hover:opacity-90"
              href="/sign-in"
            >
              Continue to secure workspace
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
