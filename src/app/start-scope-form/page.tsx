import Link from "next/link";

type CompanyEntry = {
  name: string;
  href: string;
};

const companies: CompanyEntry[] = [
  { name: "Brady Roofing", href: "/client-access/brady-roofing" },
  { name: "Chadler's Plumbing", href: "/client-access/chadlers-plumbing" },
  { name: "Clark & Clark, PC", href: "/client-access/clark-and-clark-pc" },
  { name: "Complete CPA Solutions", href: "/client-access/complete-cpa-solutions" },
  { name: "Gilman & CO. CPA", href: "/client-access/gilman-and-co-cpa" },
  { name: "Golden Spike Roofing", href: "/client-access/golden-spike-roofing" },
  { name: "High 5 Plumbing, Heating, Cooling & Electric", href: "/client-access/high-5-plumbing-heating-cooling-electric" },
  { name: "Keemer Plumbing", href: "/client-access/keemer-plumbing" },
  { name: "Lockhart & Powell CPAs", href: "/client-access/lockhart-and-powell-cpas" },
  { name: "Mark Miller Subaru", href: "/client-access/mark-miller-subaru" },
  { name: "My Denver Plumber", href: "/client-access/my-denver-plumber" },
  { name: "Schomp Honda", href: "/client-access/schomp-honda" },
  { name: "Towers Plumbing", href: "/client-access/towers-plumbing" },
  { name: "Verde", href: "/verde" },
  { name: "Valley Plumbing, Heating & Cooling", href: "/client-access/valley-plumbing-heating-cooling" }
];

export default function StartScopeFormPage() {
  return (
    <main className="app-themed-root px-4 py-10 md:px-8">
      <div className="app-hero-pattern" />
      <div className="app-content-layer mx-auto max-w-6xl space-y-6">
        <div className="app-surface-card px-6 py-8 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6366f1]">Client Access</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0f1723] md:text-4xl">Select your company</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#475569]">
            Choose the company workspace tied to your scope form. This keeps responses organized by client and ensures you enter the correct intake flow.
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link
              className="app-surface-card px-5 py-4 text-sm font-semibold text-[#1e293b] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,35,0.12)]"
              href={company.href}
              key={company.name}
            >
              <div className="flex items-center justify-between gap-3">
                <span>{company.name}</span>
                <span className="text-[#64748b]">Workspace</span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
