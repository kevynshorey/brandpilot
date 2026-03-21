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
  Hash,
  LayoutTemplate,
  Clock,
  Target,
  Sparkles,
  Search,
  Columns3,
  ChevronDown,
} from 'lucide-react';
import { signOut } from '@/hooks/use-user';
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher';

interface NavSection {
  label: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard; badge?: string }[];
}

const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Create',
    items: [
      { href: '/create', label: 'Create Post', icon: PenSquare },
      { href: '/blog', label: 'Blog', icon: BookOpen },
      { href: '/captions', label: 'Quick Caption', icon: Sparkles, badge: 'AI' },
      { href: '/repurpose', label: 'Repurpose', icon: Repeat2, badge: 'AI' },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { href: '/score', label: 'Content Score', icon: Target },
      { href: '/hashtags', label: 'Hashtags', icon: Hash },
      { href: '/best-time', label: 'Best Time', icon: Clock },
      { href: '/competitors', label: 'Competitor Spy', icon: Search, badge: 'New' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/posts', label: 'Posts', icon: FileText },
      { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
      { href: '/pillars', label: 'Content Pillars', icon: Columns3 },
      { href: '/templates', label: 'Templates', icon: LayoutTemplate },
      { href: '/approvals', label: 'Approvals', icon: Shield },
      { href: '/assets', label: 'Assets', icon: Image },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/brand', label: 'Brand', icon: Palette },
      { href: '/automations', label: 'Automations', icon: Zap },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const toggleSection = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          Brand<span className="text-amber-400">Pilot</span>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 text-zinc-400 hover:text-white rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Workspace Switcher */}
      <div className="px-3 py-2.5 border-b border-zinc-800">
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-1">
        {navSections.map(section => {
          const isCollapsed = collapsed[section.label];
          const hasActiveItem = section.items.some(item => pathname === item.href || pathname?.startsWith(item.href + '/'));

          return (
            <div key={section.label}>
              <button
                onClick={() => toggleSection(section.label)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {section.label}
                <ChevronDown className={cn('w-3 h-3 transition-transform', isCollapsed && '-rotate-90')} />
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5 mt-0.5">
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors',
                          isActive
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className={cn(
                            'ml-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full',
                            item.badge === 'New' ? 'bg-amber-500/20 text-amber-400' :
                            item.badge === 'AI' ? 'bg-violet-500/20 text-violet-400' :
                            'bg-zinc-700 text-zinc-400'
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {isCollapsed && hasActiveItem && (
                <div className="px-2.5 py-1">
                  <div className="w-1 h-1 rounded-full bg-amber-400" />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2.5 border-t border-zinc-800 space-y-1">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
        <div className="px-2.5 text-[10px] text-zinc-600">BrandPilot v0.2</div>
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

      {/* Sidebar */}
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
