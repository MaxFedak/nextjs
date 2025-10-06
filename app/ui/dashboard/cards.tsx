import {
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';

const iconMap = {
  collected: BanknotesIcon,
  customers: UserGroupIcon,
  pending: ClockIcon,
  invoices: InboxIcon,
};

export default async function CardWrapper() {
  // Use static demo values to highlight the refreshed visuals
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card title="Collected" value="$24,800" type="collected" />
      <Card title="Pending" value="$6,120" type="pending" />
      <Card title="Total Invoices" value={128} type="invoices" />
      <Card title="Total Customers" value={42} type="customers" />
    </div>
  );
}

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: 'invoices' | 'customers' | 'pending' | 'collected';
}) {
  const Icon = iconMap[type];

  const accent =
    type === 'collected'
      ? 'from-emerald-500 to-teal-500'
      : type === 'pending'
      ? 'from-amber-500 to-orange-500'
      : type === 'invoices'
      ? 'from-indigo-500 to-blue-500'
      : 'from-fuchsia-500 to-pink-500';

  return (
    <div className="card-surface p-3">
      <div className="flex items-center gap-3 p-3">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white`}>
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </div>
        <h3 className="text-sm font-medium text-slate-700">{title}</h3>
      </div>
      <p
        className={`${lusitana.className} truncate rounded-xl bg-white/90 px-4 py-6 text-center text-3xl text-slate-900`}
      >
        {value}
      </p>
    </div>
  );
}
