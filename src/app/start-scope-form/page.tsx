import Link from "next/link";

type CompanyEntry = {
  name: string;
  href: string;
};

const companies: CompanyEntry[] = [
  { name: "Accenture", href: "/client-access/accenture" },
  { name: "CBRE", href: "/client-access/cbre" },
  { name: "Cushman & Wakefield", href: "/client-access/cushman-wakefield" },
  { name: "Deloitte", href: "/client-access/deloitte" },
  { name: "Honeywell", href: "/client-access/honeywell" },
  { name: "IBM", href: "/client-access/ibm" },
  { name: "Johnson Controls", href: "/client-access/johnson-controls" },
  { name: "Microsoft", href: "/client-access/microsoft" },
  { name: "Oracle", href: "/client-access/oracle" },
  { name: "SAP", href: "/client-access/sap" },
  { name: "Schneider Electric", href: "/client-access/schneider-electric" },
  { name: "ServiceNow", href: "/client-access/servicenow" },
  { name: "Siemens", href: "/client-access/siemens" },
  { name: "Verde", href: "/verde" },
  { name: "Wipro", href: "/client-access/wipro" }
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
