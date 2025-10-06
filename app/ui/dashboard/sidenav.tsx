import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import AcmeLogo from '@/app/ui/acme-logo';
import { PowerIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';

export default function SideNav() {
  return (
    <div className="flex h-full flex-col p-3 md:p-2">
      <div className="mb-3 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-sm backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow">
            <span className="text-sm font-bold">AC</span>
          </div>
          <div className="w-28 text-slate-900 md:w-36">
            <AcmeLogo />
          </div>
        </Link>
      </div>
      <div className="flex grow flex-row justify-between gap-2 md:flex-col md:gap-2">
        <div className="rounded-2xl border border-white/20 bg-white/50 p-2 shadow-sm backdrop-blur">
          <NavLinks />
        </div>
        <div className="hidden h-auto w-full grow rounded-2xl border border-white/20 bg-white/30 shadow-sm backdrop-blur md:block" />
        <form className="md:mt-auto">
          <Button variant="ghost" className="w-full justify-start rounded-xl">
            <PowerIcon className="h-5 w-5 text-slate-600" />
            <span className="hidden md:inline">Sign Out</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
