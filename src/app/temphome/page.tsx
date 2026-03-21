"use client";

import Image from "next/image";
import Link from "next/link";
import ruxtonLogo from "../../images/ruxton_logo2.png";
import tempHomeHero from "../../images/temphome_hero.png";

export default function TempHomePage() {
  return (
    <main className="landing-root min-h-screen overflow-hidden">
      <div className="app-hero-pattern" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1560px] flex-col px-4 pb-14 pt-2 md:px-8">
        <header className="landing-fade-up sticky top-2 z-20 mx-auto w-full max-w-7xl rounded-xl bg-white/85 px-4 py-7 shadow-[0_1px_2px_rgba(16,24,40,0.05),0_14px_40px_rgba(16,24,40,0.12)] backdrop-blur md:px-6 md:py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-24 lg:gap-28">
              <Link className="flex items-center" href="/temphome">
                <Image
                  src={ruxtonLogo}
                  alt="Ruxton Labs"
                  width={210}
                  height={56}
                  className="h-12 w-auto origin-left scale-[2.05] object-contain"
                  priority
                />
              </Link>
              <nav className="hidden items-center gap-5 text-sm font-medium text-[#475569] md:flex">
                <a className="transition-colors hover:text-[#0f1723]" href="#services">
                  Services
                </a>
                <a className="transition-colors hover:text-[#0f1723]" href="#why-us">
                  Why Us
                </a>
                <a className="transition-colors hover:text-[#0f1723]" href="#approach">
                  Approach
                </a>
                <a className="transition-colors hover:text-[#0f1723]" href="#about">
                  About
                </a>
                <a className="transition-colors hover:text-[#0f1723]" href="#contact">
                  Contact
                </a>
              </nav>
            </div>
            <a className="landing-button-primary inline-flex h-9 items-center justify-center px-4 text-xs font-semibold" href="#contact">
              Let&apos;s Talk
            </a>
          </div>
        </header>

        <section className="landing-fade-up-delay-1 relative mx-auto mt-8 w-full max-w-7xl">
          <div className="relative overflow-hidden rounded-xl border border-white/40 bg-[linear-gradient(115deg,#fefefe_0%,#f7f9fc_30%,#f4f7fb_50%,#f3f6fa_70%,#edf2fa_100%)] shadow-[0_20px_60px_rgba(15,23,35,0.14)]">
            <div className="relative mx-auto w-full max-w-[1024px]">
              <Image
                src={tempHomeHero}
                alt="Operational software and AI systems illustration"
                priority
                unoptimized
                className="h-auto w-full"
              />
            </div>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full px-6 py-8 md:px-10 md:py-10 lg:px-14">
                <div className="max-w-[56%] xl:max-w-[52%]">
                <p className="text-sm font-medium text-[#111827] md:text-xl md:leading-tight">
                  AI-powered solutions for faster, smarter operations
                </p>
                <h1 className="mt-3 text-4xl font-black uppercase leading-[0.95] tracking-[-0.02em] text-[#0a1730] md:text-5xl lg:text-6xl">
                  Streamline your business with custom operational software
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[#0f172a] md:text-2xl md:leading-9">
                  Focus on speed and clarity. Remove operational friction and build dependable systems focused on your business goals
                  with our tailormade solutions.
                </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      className="inline-flex h-11 items-center justify-center rounded-full bg-[#0f74da] px-10 text-sm font-bold uppercase tracking-[0.02em] text-white shadow-[0_10px_24px_rgba(15,116,218,0.35)]"
                      href="#contact"
                    >
                      Let&apos;s Talk
                    </a>
                    <a
                      className="inline-flex h-11 items-center justify-center rounded-full border border-[#1e293b] bg-white px-10 text-sm font-bold uppercase tracking-[0.02em] text-[#111827] shadow-[0_8px_20px_rgba(15,23,35,0.12)]"
                      href="#services"
                    >
                      See What We Do
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="landing-fade-up-delay-2 mx-auto mt-8 grid w-full max-w-7xl gap-4 md:grid-cols-2">
          <article className="landing-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Custom Software</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#0f1723]">Built around your workflow</h2>
            <p className="mt-3 text-sm leading-7 text-[#334155]">
              We design and build software around how your team actually works, so the tool supports the business instead of forcing
              people into a rigid template.
            </p>
          </article>
          <article className="landing-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">AI-Powered Development</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#0f1723]">AI acceleration with senior oversight</h2>
            <p className="mt-3 text-sm leading-7 text-[#334155]">
              We use AI heavily across planning, implementation, and testing to speed delivery, while experienced engineers ensure
              quality, reliability, and long-term maintainability.
            </p>
          </article>
          <article className="landing-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Strategic Advisory</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#0f1723]">Clear decisions in complex environments</h2>
            <p className="mt-3 text-sm leading-7 text-[#334155]">
              We help teams shape roadmaps, prioritize opportunities, and manage change so software investments map directly to business
              outcomes.
            </p>
          </article>
          <article className="landing-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Enterprise and Scale</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#0f1723]">Lean team, dependable delivery</h2>
            <p className="mt-3 text-sm leading-7 text-[#334155]">
              As scope expands, we scale delivery through trusted talent while preserving accountability, visibility, and direct access
              to decision makers.
            </p>
          </article>
        </section>

        <section
          id="why-us"
          className="landing-fade-up-delay-3 mx-auto mt-8 w-full max-w-7xl rounded-xl bg-[linear-gradient(135deg,#0c1322_0%,#111f3d_50%,#312e81_100%)] px-8 py-10 text-white shadow-[0_28px_80px_rgba(15,23,35,0.35)] md:px-10 md:py-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Why Ruxton Labs</p>
          <h2 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Practical software strategy backed by AI-first execution.
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white/10 p-4 text-sm leading-7 text-white/85">
              <span className="font-semibold text-white">Fast:</span> Short feedback loops and AI-assisted workflows keep momentum high.
            </div>
            <div className="rounded-lg bg-white/10 p-4 text-sm leading-7 text-white/85">
              <span className="font-semibold text-white">Lean:</span> Small by design, so your budget goes toward building rather than
              overhead.
            </div>
            <div className="rounded-lg bg-white/10 p-4 text-sm leading-7 text-white/85">
              <span className="font-semibold text-white">Experienced:</span> Real delivery history across startups, SMB tools, and
              enterprise systems.
            </div>
            <div className="rounded-lg bg-white/10 p-4 text-sm leading-7 text-white/85">
              <span className="font-semibold text-white">Local:</span> Mountain West roots and practical communication from people who
              understand operators.
            </div>
            <div className="rounded-lg bg-white/10 p-4 text-sm leading-7 text-white/85 md:col-span-2 lg:col-span-1">
              <span className="font-semibold text-white">Values-driven:</span> Honest guidance, clear expectations, and long-term
              partnerships.
            </div>
          </div>
        </section>

        <section id="approach" className="mx-auto mt-8 w-full max-w-7xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Our Approach</p>
          <h2 className="mt-2 text-center text-3xl font-semibold tracking-tight text-[#0f1723] md:text-4xl">
            Simple process. Clear momentum. Real outcomes.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="landing-card p-6">
              <p className="text-2xl font-semibold text-[#1f73ff]">01</p>
              <h3 className="mt-2 text-lg font-semibold text-[#0f1723]">Listen</h3>
              <p className="mt-2 text-sm leading-7 text-[#334155]">
                We start by understanding your goals, constraints, systems, and team realities before proposing solutions.
              </p>
            </article>
            <article className="landing-card p-6">
              <p className="text-2xl font-semibold text-[#1f73ff]">02</p>
              <h3 className="mt-2 text-lg font-semibold text-[#0f1723]">Build</h3>
              <p className="mt-2 text-sm leading-7 text-[#334155]">
                We deliver in focused iterations with transparent progress, fast feedback loops, and high accountability.
              </p>
            </article>
            <article className="landing-card p-6">
              <p className="text-2xl font-semibold text-[#1f73ff]">03</p>
              <h3 className="mt-2 text-lg font-semibold text-[#0f1723]">Partner</h3>
              <p className="mt-2 text-sm leading-7 text-[#334155]">
                After launch, we stay close to help refine workflows, support adoption, and extend what works.
              </p>
            </article>
          </div>
        </section>

        <section id="about" className="mx-auto mt-10 w-full max-w-6xl text-center">
          <p className="text-sm leading-8 text-[#475569]">
            Ruxton Labs is a software team rooted in the Mountain West, helping companies improve operations through practical digital
            tools. From internal workflow apps to broader change and scope management systems, we focus on solutions that are useful,
            maintainable, and built for the way real teams work.
          </p>
        </section>

        <section
          id="contact"
          className="mx-auto mt-8 w-full max-w-7xl rounded-xl bg-[linear-gradient(135deg,#0b1630_0%,#1a2a52_44%,#4f46e5_100%)] px-8 py-10 text-center text-white md:px-10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Contact</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Tell us what you are building.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/85">
            If your team needs better operational flow, smarter tooling, or AI-accelerated software delivery, we will map out a practical
            next step together.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a className="landing-button-primary inline-flex h-11 items-center justify-center px-5 text-sm font-semibold" href="mailto:hello@ruxtonlabs.com">
              hello@ruxtonlabs.com
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
