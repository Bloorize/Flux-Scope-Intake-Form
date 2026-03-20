import Link from "next/link";

type CompanyEntry = {
  name: string;
  href: string;
};

const companies: CompanyEntry[] = [
  { name: "Aspen Operations Co.", href: "/client-access/aspen-operations-co" },
  { name: "Atlas Field Performance", href: "/client-access/atlas-field-performance" },
  { name: "Blue Harbor Logistics", href: "/client-access/blue-harbor-logistics" },
  { name: "ClearPath Maintenance", href: "/client-access/clearpath-maintenance" },
  { name: "Elevate Campus Operations", href: "/client-access/elevate-campus-operations" },
  { name: "Granite Industrial Partners", href: "/client-access/granite-industrial-partners" },
  { name: "Horizon Utilities Network", href: "/client-access/horizon-utilities-network" },
  { name: "Lighthouse Property Services", href: "/client-access/lighthouse-property-services" },
  { name: "Northbridge Facilities Group", href: "/client-access/northbridge-facilities-group" },
  { name: "Pioneer SiteWorks", href: "/client-access/pioneer-siteworks" },
  { name: "RidgeLine Service Group", href: "/client-access/ridgeline-service-group" },
  { name: "Sterling Compliance Systems", href: "/client-access/sterling-compliance-systems" },
  { name: "Summit Field Solutions", href: "/client-access/summit-field-solutions" },
  { name: "Verde", href: "/verde" },
  { name: "Westlake Commercial Services", href: "/client-access/westlake-commercial-services" }
];

export default function StartScopeFormPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,76,129,0.14),_transparent_30%),linear-gradient(180deg,#f7f8fb_0%,#edf2f7_100%)] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-white/90 px-6 py-8 shadow-[0_1px_2px_rgba(16,24,40,0.05),0_16px_44px_rgba(16,24,40,0.12)] backdrop-blur md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6366f1]">Client Access</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0f1723] md:text-4xl">Select your company</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#475569]">
            Choose the company workspace tied to your scope form. This keeps responses organized by client and ensures you enter the correct intake flow.
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link
              className="rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 text-sm font-semibold text-[#1e293b] shadow-[0_10px_26px_rgba(15,23,35,0.08)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,35,0.12)]"
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
