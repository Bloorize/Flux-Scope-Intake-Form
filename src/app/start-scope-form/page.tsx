import Link from "next/link";

type CompanyEntry = {
  name: string;
  href: string;
};

const companies: CompanyEntry[] = [
  { name: "Arbor Lane Property Group", href: "/client-access/arbor-lane-property-group" },
  { name: "Beacon Facilities Co.", href: "/client-access/beacon-facilities-co" },
  { name: "Blue Oak Building Services", href: "/client-access/blue-oak-building-services" },
  { name: "Clearwater Site Management", href: "/client-access/clearwater-site-management" },
  { name: "East Ridge Operations", href: "/client-access/east-ridge-operations" },
  { name: "Harbor Point Maintenance", href: "/client-access/harbor-point-maintenance" },
  { name: "Ironwood Compliance Group", href: "/client-access/ironwood-compliance-group" },
  { name: "Lakeside Field Services", href: "/client-access/lakeside-field-services" },
  { name: "Northfield Asset Care", href: "/client-access/northfield-asset-care" },
  { name: "Pinecrest Portfolio Services", href: "/client-access/pinecrest-portfolio-services" },
  { name: "Riverbend Operations LLC", href: "/client-access/riverbend-operations-llc" },
  { name: "Summit Peak Property Services", href: "/client-access/summit-peak-property-services" },
  { name: "Townline Facilities Partners", href: "/client-access/townline-facilities-partners" },
  { name: "Verde", href: "/verde" },
  { name: "Westbrook Building Solutions", href: "/client-access/westbrook-building-solutions" }
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
