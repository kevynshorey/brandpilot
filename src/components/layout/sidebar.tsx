'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  PenSquare,
  FileText,
  Megaphone,
  BarChart3,
  Image,
  Palette,
  Zap,
  Settings,
  LogOut,
  BookOpen,
  Menu,
  X,
  Repeat2,
  Shield,
} from 'lucide-react';
import { signOut } from '@/hooks/use-user';
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/create', label: 'Create Post', icon: PenSquare },
  { href: '/blog', label: 'Blog', icon: BookOpen },
  { href: '/posts', label: 'Posts', icon: FileText },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/repurpose', label: 'Repurpose', icon: Repeat2 },
  { href: '/approvals', label: 'Approvals', icon: Shield },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/assets', label: 'Assets', icon: Image },
  { href: '/brand', label: 'Brand', icon: Palette },
  { href: '/automations', label: 'Automations', icon: Zap },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-800">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">
          Brand<span className="text-amber-400">Pilot</span>
        </Link>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 text-zinc-400 hover:text-white rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Workspace Switcher */}
      <div className="px-3 py-3 border-b border-zinc-800">
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-zinc-800 space-y-1">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
        <div className="px-3 text-xs text-zinc-600">BrandPilot v0.1</div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-zinc-400 hover:text-white rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard" className="ml-3 text-lg font-bold tracking-tight text-white">
          Brand<span className="text-amber-400">Pilot</span>
        </Link>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop: always visible, mobile: slide in */}
      <aside className={cn(
        'fixed top-0 left-0 h-screen w-64 bg-zinc-950 text-white flex flex-col border-r border-zinc-800 z-50 transition-transform duration-200',
        'lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}
