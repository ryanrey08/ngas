import { ChartColumn, Landmark, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

const highlights = [
  { icon: Landmark, title: "Budget execution", text: "Track appropriations, allotments and obligations in real time." },
  { icon: ChartColumn, title: "Financial reporting", text: "Generate trial balances and accountability reports in minutes." },
  { icon: ShieldCheck, title: "Role-based control", text: "Approvals and permissions aligned to your agency's workflow." },
];

export function AuthBrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-ink-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      {/* Decorative swoosh + glow derived from the logo */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-600/30 blur-3xl" />
      <svg aria-hidden className="pointer-events-none absolute bottom-0 left-0 w-full text-brand-600" viewBox="0 0 800 240" preserveAspectRatio="none">
        <path d="M0 200 C 220 120, 420 260, 800 90 L 800 240 L 0 240 Z" fill="currentColor" opacity="0.18" />
        <path d="M0 230 C 260 150, 460 250, 800 140" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      </svg>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative">
        <div className="inline-flex rounded-2xl bg-white px-5 py-3 shadow-pop">
          <Logo width={230} priority />
        </div>
      </div>

      <div className="relative max-w-lg">
        <p className="text-xs font-bold tracking-[0.3em] text-brand-400 uppercase">New Government Accounting System</p>
        <h2 className="mt-4 text-4xl leading-tight font-extrabold xl:text-5xl">
          Transparent, accountable <span className="text-brand-500">public finance.</span>
        </h2>
        <ul className="mt-10 space-y-5">
          {highlights.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-400 ring-1 ring-brand-500/30">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block font-heading font-semibold">{title}</span>
                <span className="block text-sm text-neutral-400">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-neutral-500">© 2026 NGAS. For authorized government personnel only.</p>
    </aside>
  );
}
