import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-white px-6 text-center">
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-ink-900/10 blur-3xl" />
      <Logo width={200} priority />
      <p className="mt-8 font-heading text-7xl font-extrabold tracking-tight sm:text-8xl">
        <span className="text-ink-900">4</span>
        <span className="text-brand-600">0</span>
        <span className="text-ink-900">4</span>
      </p>
      <h1 className="mt-3 text-xl font-bold text-ink-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-500">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved. Check the address or return to the dashboard.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to NGAS
      </Link>
      <div aria-hidden className="mt-12 h-1 w-24 rounded-full bg-brand-600" />
    </main>
  );
}
