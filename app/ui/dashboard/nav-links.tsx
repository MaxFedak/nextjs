'use client'
import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import {usePathname} from "next/navigation";
import clsx from 'clsx';
// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  {
    name: 'Invoices',
    href: '/dashboard/invoices',
    icon: DocumentDuplicateIcon,
  },
  { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon },
];

export default function NavLinks() {
  const pathname = usePathname()
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'group relative flex h-[44px] grow items-center justify-center gap-3 rounded-xl border border-transparent px-3 text-sm font-medium text-slate-700 transition md:flex-none md:justify-start',
              'hover:bg-white/70 hover:text-indigo-700 hover:border-indigo-200',
              pathname === link.href && 'bg-white/80 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
            )}
          >
            <LinkIcon className="w-5 text-slate-500 transition group-hover:text-indigo-600" />
            <p className="hidden md:block tracking-wide">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
