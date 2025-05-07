'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Briefcase, 
  FileText 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Job Listings', href: '/dashboard', icon: Home },
  { name: 'My Applications', href: '/applications', icon: Briefcase },
  { name: 'Resume Customization', href: '/resume', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-black/40 backdrop-blur-xl z-10">
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-2xl font-bold text-white">TalentTrek Jobs</h1>
      </div>
      <nav className="flex flex-1 flex-col px-4 py-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      pathname === item.href
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10',
                      'group flex gap-x-3 rounded-ios p-2 text-sm font-semibold leading-6 transition-all duration-200'
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-6 w-6 shrink-0",
                        pathname === item.href
                          ? 'text-primary'
                          : 'text-white/70 group-hover:text-white'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
} 