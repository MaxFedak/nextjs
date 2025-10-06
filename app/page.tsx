import AcmeLogo from '@/app/ui/acme-logo';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { lusitana } from '@/app/ui/fonts';
import { Button } from '@/app/ui/button';

export default function Page() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col p-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="h-10 w-32 text-slate-900 md:w-40">
          <AcmeLogo />
        </div>
        <div className="hidden md:block">
          <Link href="/login">
            <Button variant="secondary" size="sm">Log in</Button>
          </Link>
        </div>
      </div>

      <section className="relative grid grow grid-cols-1 items-center gap-8 md:grid-cols-2">
        <div className="card-surface order-2 rounded-3xl p-8 md:order-1 md:p-12">
          <h1 className={`${lusitana.className} text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl`}>
            Autodoc Playground
          </h1>
          <p className="mt-4 max-w-prose text-slate-600 md:text-lg">
            A deliberately bold UI refresh to help you test automated documentation pipelines. This landing page, navigation, buttons, and dashboard cards have all been overhauled.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link href="/dashboard">
              <Button size="lg" variant="primary" trailingIcon={<ArrowRightIcon className="h-5 w-5" />}>Open Dashboard</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="ghost">Log in</Button>
            </Link>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <div className="absolute inset-0 -rotate-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 opacity-90 blur-[2px]" />
            <div className="absolute inset-0 rotate-3 rounded-3xl bg-white/80 shadow-xl ring-1 ring-slate-200 backdrop-blur" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 p-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow">
                <span className="text-lg font-bold">AC</span>
              </div>
              <p className="max-w-xs text-center text-slate-600">Beautifully minimal components redesigned for demonstration purposes.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
