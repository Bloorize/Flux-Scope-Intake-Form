"use client";

import { Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import heroNew1 from "../../images/hero_new_1.png";
import iconAutomation from "../../images/icon_automation.png";
import howWeBuild1 from "../../images/how_we_build_1.png";
import iconAccuracy from "../../images/icon_accuracy.png";
import iconSpeed from "../../images/icon_speed.png";
import iconVisibility from "../../images/icon_visibility.png";
import operationalChange from "../../images/operational_change.png";
import aboutRuxtonOffice from "../../images/about_ruxton_office.png";
import ruxtonLogo from "../../images/ruxton_logo2.png";
import tailoredSystems from "../../images/tailored_systems.png";

export default function TempHomePage() {
  return (
    <main className="landing-root min-h-screen overflow-hidden">
      <div className="app-hero-pattern" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1560px] flex-col px-4 pt-2 md:px-8">
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
                <a className="transition-colors hover:text-[#0f1723]" href="#context">
                  Context
                </a>
                <a className="transition-colors hover:text-[#0f1723]" href="#build">
                  Build
                </a>
                <a className="transition-colors hover:text-[#0f1723]" href="#change">
                  Change
                </a>
                <a className="transition-colors hover:text-[#0f1723]" href="#tailored">
                  Tailored
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
          <div className="relative overflow-hidden rounded-xl border border-white/40 bg-[#edf2fa] shadow-[0_20px_60px_rgba(15,23,35,0.14)]">
            <div className="relative aspect-[16/7] min-h-[300px]">
              <Image
                src={heroNew1}
                alt="Operational systems hero illustration"
                fill
                priority
                sizes="(min-width: 1024px) 80vw, 100vw"
                className="object-cover object-[60%_50%]"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(7,18,35,0.48)_0%,rgba(7,18,35,0.38)_38%,rgba(7,18,35,0.12)_62%,rgba(7,18,35,0)_100%)]" />
            <div className="absolute inset-0 flex items-center">
              <div className="w-full px-6 py-8 md:px-10 lg:px-12">
                <div className="max-w-[520px]">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80 md:text-sm">Ruxton Labs</p>
                  <h1 className="mt-3 text-3xl font-black uppercase leading-[0.94] tracking-[-0.02em] text-white md:text-5xl">
                    Clear operations. Better systems. Measurable progress.
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-white/90 md:text-base md:leading-7">
                    We help teams reduce process friction, align stakeholders, and implement practical software that supports how the business really runs.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      className="inline-flex h-11 items-center justify-center rounded-full bg-[#0f74da] px-8 text-sm font-bold uppercase tracking-[0.02em] text-white shadow-[0_10px_24px_rgba(15,116,218,0.35)]"
                      href="#contact"
                    >
                      Let&apos;s Talk
                    </a>
                    <a
                      className="inline-flex h-11 items-center justify-center rounded-full border border-white/70 bg-white px-8 text-sm font-bold uppercase tracking-[0.02em] text-[#111827] shadow-[0_8px_20px_rgba(15,23,35,0.12)]"
                      href="#context"
                    >
                      How We Work
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="context" className="mx-auto mt-10 w-full max-w-5xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">More than software delivery</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-[#0f1723] md:text-5xl">
            Technology alone does not fix business friction.
          </h2>
          <p className="mx-auto mt-4 max-w-4xl text-base leading-8 text-[#334155] md:text-xl md:leading-9">
            The hard part is aligning systems, people, process, and decision-making. We help organizations remove operational drag and then implement
            practical software that keeps the improvement in place.
          </p>
        </section>

        <section id="build" className="mx-auto mt-10 w-full max-w-7xl rounded-xl bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,35,0.08)] md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">How we build</p>
              <h3 className="mt-2 text-3xl font-semibold tracking-tight text-[#0f1723] md:text-4xl">
                AI-accelerated delivery with senior engineering judgment.
              </h3>
              <p className="mt-4 text-sm leading-7 text-[#334155] md:text-base">
                We use AI across planning, implementation, and testing to shorten cycles, while experienced operators and engineers ensure the output is
                dependable, maintainable, and tied to real outcomes.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="landing-card p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-md border border-[#d5deeb] bg-[#f8fbff] p-2">
                    <Image src={iconSpeed} alt="Speed icon" className="h-full w-full object-contain" />
                  </div>
                  <p className="mt-3 text-[13px] leading-5 text-[#334155]">Faster loops from decision to shipped improvement.</p>
                </div>
                <div className="landing-card p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-md border border-[#d5deeb] bg-[#f8fbff] p-2">
                    <Image src={iconAccuracy} alt="Accuracy icon" className="h-full w-full object-contain" />
                  </div>
                  <p className="mt-3 text-[13px] leading-5 text-[#334155]">Reviews and quality gates that prevent fragile builds.</p>
                </div>
                <div className="landing-card p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-md border border-[#d5deeb] bg-[#f8fbff] p-2">
                    <Image src={iconAutomation} alt="Automation icon" className="h-full w-full object-contain" />
                  </div>
                  <p className="mt-3 text-[13px] leading-5 text-[#334155]">Automate repetitive work and reduce manual risk.</p>
                </div>
                <div className="landing-card p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-md border border-[#d5deeb] bg-[#f8fbff] p-2">
                    <Image src={iconVisibility} alt="Visibility icon" className="h-full w-full object-contain" />
                  </div>
                  <p className="mt-3 text-[13px] leading-5 text-[#334155]">Reporting that surfaces impact and bottlenecks early.</p>
                </div>
              </div>
            </div>
            <div className="relative min-h-[320px] overflow-hidden rounded-xl border border-[#d8e3f0]">
              <Image
                src={howWeBuild1}
                alt="AI-assisted software build workflow diagram"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </section>

        <section
          id="change"
          className="mx-auto mt-8 w-full max-w-7xl rounded-xl bg-[linear-gradient(135deg,#0c1322_0%,#111f3d_50%,#312e81_100%)] px-8 py-10 text-white shadow-[0_28px_80px_rgba(15,23,35,0.35)] md:px-10 md:py-12"
        >
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="relative min-h-[320px] overflow-hidden rounded-xl border border-white/20 bg-[#f8f4fc]">
              <Image
                src={operationalChange}
                alt="Operational change workflow visualization"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-contain object-center"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Operational change</p>
              <h3 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Software adoption succeeds when people, process, and scope stay aligned.</h3>
              <p className="mt-4 text-sm leading-7 text-white/85 md:text-base">
                We work with stakeholders, leadership, and delivery teams to define what changes, what stays stable, and how to protect momentum during
                rollout.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-white/10 p-4 text-[13px] leading-6 text-white/85">
                  <span className="font-semibold text-white">Scope discipline:</span> Shared guardrails that keep hidden work from derailing delivery.
                </div>
                <div className="rounded-lg bg-white/10 p-4 text-[13px] leading-6 text-white/85">
                  <span className="font-semibold text-white">Adoption planning:</span> Rollout plans teams can actually execute.
                </div>
                <div className="rounded-lg bg-white/10 p-4 text-[13px] leading-6 text-white/85">
                  <span className="font-semibold text-white">Decision clarity:</span> Make tradeoffs clear before they become expensive.
                </div>
                <div className="rounded-lg bg-white/10 p-4 text-[13px] leading-6 text-white/85">
                  <span className="font-semibold text-white">Change support:</span> Keep ownership and communication clear through transition.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="tailored" className="mx-auto mt-8 w-full max-w-7xl rounded-xl border border-white/40 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,35,0.08)] md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Tailored systems</p>
              <h3 className="mt-2 text-3xl font-semibold tracking-tight text-[#0f1723] md:text-4xl">Fit technology to your operation instead of forcing a generic template.</h3>
              <p className="mt-4 text-sm leading-7 text-[#334155] md:text-base">
                Sometimes we build from scratch. Sometimes we adapt existing tools. Often it is a blend. The priority is always the same: solve the real
                operational problem with the least friction and strongest long-term fit.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <article className="landing-card p-4">
                  <h4 className="text-sm font-semibold text-[#0f1723]">System extensions</h4>
                  <p className="mt-2 text-[13px] leading-5 text-[#334155]">Add missing capabilities to platforms you already use.</p>
                </article>
                <article className="landing-card p-4">
                  <h4 className="text-sm font-semibold text-[#0f1723]">Process-first integrations</h4>
                  <p className="mt-2 text-[13px] leading-5 text-[#334155]">Connect data and workflows around one operational truth.</p>
                </article>
                <article className="landing-card p-4">
                  <h4 className="text-sm font-semibold text-[#0f1723]">Operator-centered UX</h4>
                  <p className="mt-2 text-[13px] leading-5 text-[#334155]">Design interfaces that match real team decisions.</p>
                </article>
                <article className="landing-card p-4">
                  <h4 className="text-sm font-semibold text-[#0f1723]">Long-term maintainability</h4>
                  <p className="mt-2 text-[13px] leading-5 text-[#334155]">Build foundations that stay flexible as you scale.</p>
                </article>
              </div>
            </div>
            <div className="relative min-h-[320px] overflow-hidden rounded-xl border border-[#d8e3f0]">
              <Image
                src={tailoredSystems}
                alt="Tailored systems and modular customization visualization"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </section>

        <section id="why-us" className="mx-auto mt-8 w-full max-w-7xl rounded-xl bg-[#f4f7fd] px-8 py-10 shadow-[0_20px_50px_rgba(15,23,35,0.08)] md:px-10 md:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Why Ruxton Labs</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#0f1723] md:text-4xl">Practical strategy backed by hands-on execution.</h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-[#334155] md:text-base">
            We combine advisory-level thinking with build-level accountability. You get clear recommendations and an implementation partner that stays with
            you through operational adoption.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-4 text-sm leading-7 text-[#334155]">
              <span className="font-semibold text-[#0f1723]">Fast:</span> Short feedback loops keep momentum high.
            </div>
            <div className="rounded-lg bg-white p-4 text-sm leading-7 text-[#334155]">
              <span className="font-semibold text-[#0f1723]">Lean:</span> Small-team focus keeps overhead low and communication direct.
            </div>
            <div className="rounded-lg bg-white p-4 text-sm leading-7 text-[#334155]">
              <span className="font-semibold text-[#0f1723]">Experienced:</span> Delivery history across startups, SMB tools, and enterprise systems.
            </div>
            <div className="rounded-lg bg-white p-4 text-sm leading-7 text-[#334155]">
              <span className="font-semibold text-[#0f1723]">Local:</span> Mountain West roots and practical communication.
            </div>
            <div className="rounded-lg bg-white p-4 text-sm leading-7 text-[#334155] md:col-span-2 lg:col-span-1">
              <span className="font-semibold text-[#0f1723]">Values-driven:</span> Honest guidance, clear expectations, long-term partnerships.
            </div>
            <div className="rounded-lg bg-white p-4 text-sm leading-7 text-[#334155]">
              <span className="font-semibold text-[#0f1723]">Outcome-focused:</span> Every engagement ties back to measurable business progress.
            </div>
          </div>
        </section>

        <section id="approach" className="mx-auto mt-8 w-full max-w-7xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Our Approach</p>
          <h2 className="mt-2 text-center text-3xl font-semibold tracking-tight text-[#0f1723] md:text-4xl">Simple process. Clear momentum. Real outcomes.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="landing-card p-6">
              <p className="text-2xl font-semibold text-[#1f73ff]">01</p>
              <h3 className="mt-2 text-lg font-semibold text-[#0f1723]">Listen</h3>
              <p className="mt-2 text-sm leading-7 text-[#334155]">
                We map goals, constraints, systems, and team realities before proposing any solution path.
              </p>
            </article>
            <article className="landing-card p-6">
              <p className="text-2xl font-semibold text-[#1f73ff]">02</p>
              <h3 className="mt-2 text-lg font-semibold text-[#0f1723]">Build</h3>
              <p className="mt-2 text-sm leading-7 text-[#334155]">
                We implement in focused iterations with transparent checkpoints and measurable operational impact.
              </p>
            </article>
            <article className="landing-card p-6">
              <p className="text-2xl font-semibold text-[#1f73ff]">03</p>
              <h3 className="mt-2 text-lg font-semibold text-[#0f1723]">Partner</h3>
              <p className="mt-2 text-sm leading-7 text-[#334155]">
                After launch, we stay close to support adoption, refine workflows, and extend what proves valuable.
              </p>
            </article>
          </div>
        </section>

        <section id="about" className="mx-auto mt-10 w-full max-w-7xl rounded-xl border border-white/40 bg-white/85 p-6 shadow-[0_20px_50px_rgba(15,23,35,0.08)] md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">About Ruxton Labs</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#0f1723] md:text-4xl">A small team built for high-accountability transformation work.</h2>
              <p className="mt-4 text-sm leading-7 text-[#334155] md:text-base">
                Ruxton Labs is rooted in the Mountain West and shaped by practical operators, product builders, and engineers who have seen how quickly good
                businesses can get slowed down by process friction.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#334155] md:text-base">
                We work best with teams that value clear communication, decisive execution, and software that supports the way people actually work. From
                internal operational tooling to broader workflow modernization, we help organizations move with confidence.
              </p>
            </div>
            <div className="relative min-h-[320px] overflow-hidden rounded-xl border border-[#d8e3f0]">
              <Image
                src={aboutRuxtonOffice}
                alt="Ruxton Labs team collaborating in office"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="mx-auto mt-8 mb-10 w-full max-w-7xl rounded-xl bg-[linear-gradient(135deg,#0b1630_0%,#1a2a52_44%,#4f46e5_100%)] px-8 py-10 text-center text-white md:px-10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Contact</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Tell us what your team is trying to improve.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/85">
            If your organization needs stronger operational flow, clearer scope control, or better software support for critical work, we can map the next
            practical step together.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a className="landing-button-primary inline-flex h-11 items-center justify-center px-5 text-sm font-semibold" href="mailto:hello@ruxtonlabs.com">
              hello@ruxtonlabs.com
            </a>
          </div>
        </section>
      </div>

      <footer className="temphome-footer">
        <div className="temphome-footer-inner">
          <div>
            <Link className="inline-flex items-center" href="/temphome">
              <Image src={ruxtonLogo} alt="Ruxton Labs" width={210} height={56} className="h-10 w-auto object-contain" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-[#b4c0d6]">
              Business-aligned technology and operational systems that help teams move faster with less friction.
            </p>
          </div>

          <div>
            <h3 className="temphome-footer-heading">Company</h3>
            <ul className="temphome-footer-links">
              <li>
                <a href="#about">About</a>
              </li>
              <li>
                <a href="#approach">Approach</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="temphome-footer-heading">Resources</h3>
            <ul className="temphome-footer-links">
              <li>
                <a href="#">Insights (coming soon)</a>
              </li>
              <li>
                <a href="#">Case studies (coming soon)</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="temphome-footer-heading">Connect</h3>
            <ul className="temphome-footer-links">
              <li>
                <a href="mailto:hello@ruxtonlabs.com">hello@ruxtonlabs.com</a>
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-3">
              <a className="temphome-social-link" href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="Ruxton Labs LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
              <a className="temphome-social-link" href="https://x.com" target="_blank" rel="noreferrer" aria-label="Ruxton Labs Twitter">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="temphome-footer-bottom">2026 Ruxton Labs. All rights reserved.</div>
      </footer>
    </main>
  );
}
