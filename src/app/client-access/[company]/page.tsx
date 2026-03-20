type ClientAccessPageProps = {
  params: Promise<{ company: string }>;
};

export default async function ClientAccessPage({ params }: ClientAccessPageProps) {
  const { company } = await params;
  const companyName = company
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <main className="app-themed-root px-4 py-10 md:px-8">
      <div className="app-hero-pattern" />
      <div className="app-content-layer mx-auto max-w-xl space-y-6">
        <div className="app-surface-card px-6 py-8 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6366f1]">Client Access</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#0f1723] md:text-3xl">{companyName}</h1>
          <p className="mt-3 text-sm leading-7 text-[#475569]">
            Enter the client password to unlock this workspace.
          </p>

          <form className="mt-5 space-y-3">
            <input
              className="w-full rounded-xl border border-[#d6deea] bg-white px-4 py-2.5 text-sm text-[#0f1723] outline-none transition focus:border-[#94a3b8]"
              placeholder="Password"
              type="password"
            />
            <button
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#111827] px-4 text-sm font-semibold text-white"
              type="button"
            >
              Unlock workspace
            </button>
          </form>
        </div>

        <div className="app-surface-card px-5 py-4 text-sm leading-7 text-[#475569]">
          This client workspace is not enabled yet. Please contact Ruxton Labs to activate access.
        </div>
      </div>
    </main>
  );
}
