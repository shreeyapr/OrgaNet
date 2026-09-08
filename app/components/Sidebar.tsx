"use client";

import {
    BarChart3,
    CalendarDays,
    CheckSquare,
    ChevronDown,
    ChevronRight,
    CircleDollarSign,
    LayoutDashboard,
    LifeBuoy,
    Search,
    Settings,
    Sparkles,
    Users,
    Wrench,
    X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

const mainNavigation = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    label: "Events",
    href: "/events",
    icon: LayoutDashboard,
  },
];

const operationsNavigation = [
  {
    label: "Operations",
    href: "/operations",
    icon: Wrench,
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
];

const analyticsNavigation = [
  {
    label: "Financials",
    href: "/financials",
    icon: CircleDollarSign,
  },
  {
    label: "Insights",
    href: "/insights",
    icon: BarChart3,
  },
];

export default function Sidebar({
  isOpen = true,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const [crmOpen, setCrmOpen] = useState(
    pathname.startsWith("/accounts") ||
      pathname.startsWith("/contacts")
  );

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col
        border-r border-slate-200 bg-white
        transition-transform duration-300
        lg:static lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Logo */}
      <div className="flex h-[72px] items-center justify-between border-b border-slate-200 px-6">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
            <Sparkles size={18} strokeWidth={2.2} />
          </div>

          <div>
            <div className="text-[16px] font-bold tracking-tight text-slate-950">
              VenueOps
            </div>

            <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
              Operations Platform
            </div>
          </div>
        </Link>

        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">

        {/* Main */}
        <NavigationGroup>
          {mainNavigation.map((item) => (
            <NavigationItem
              key={item.label}
              label={item.label}
              href={item.href}
              icon={item.icon}
              active={isActive(item.href)}
              onClick={onClose}
            />
          ))}
        </NavigationGroup>

        {/* Business */}
        <NavigationGroup title="Business">
          <button
            onClick={() => setCrmOpen((value) => !value)}
            className={`
              group flex w-full items-center gap-3 rounded-xl px-3 py-2.5
              text-left transition-all
              ${
                pathname.startsWith("/accounts") ||
                pathname.startsWith("/contacts")
                  ? "bg-slate-100 text-slate-950"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }
            `}
          >
            <Users
              size={18}
              className="text-slate-400 group-hover:text-slate-700"
            />

            <span className="flex-1 text-[13px] font-medium">
              CRM
            </span>

            {crmOpen ? (
              <ChevronDown size={15} className="text-slate-400" />
            ) : (
              <ChevronRight size={15} className="text-slate-400" />
            )}
          </button>

          {crmOpen && (
            <div className="ml-9 mt-1 space-y-1 border-l border-slate-200 pl-3">
              <SubNavigationItem
                label="Accounts"
                href="/accounts"
                active={isActive("/accounts")}
                onClick={onClose}
              />

              <SubNavigationItem
                label="Contacts"
                href="/contacts"
                active={isActive("/contacts")}
                onClick={onClose}
              />
            </div>
          )}
        </NavigationGroup>

        {/* Operations */}
        <NavigationGroup title="Operations">
          {operationsNavigation.map((item) => (
            <NavigationItem
              key={item.label}
              label={item.label}
              href={item.href}
              icon={item.icon}
              active={isActive(item.href)}
              onClick={onClose}
            />
          ))}
        </NavigationGroup>

        {/* Analytics */}
        <NavigationGroup title="Analytics">
          {analyticsNavigation.map((item) => (
            <NavigationItem
              key={item.label}
              label={item.label}
              href={item.href}
              icon={item.icon}
              active={isActive(item.href)}
              onClick={onClose}
            />
          ))}
        </NavigationGroup>

        {/* AI */}
        <div className="mt-7">
          <Link
            href="/ai"
            onClick={onClose}
            className={`
              group flex w-full items-center gap-3 rounded-xl px-3 py-3
              transition-all
              ${
                isActive("/ai")
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }
            `}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <Sparkles size={16} />
            </div>

            <div>
              <div className="text-sm font-semibold">
                AI Assistant
              </div>

              <div className="text-[11px] text-slate-400">
                Ask VenueOps
              </div>
            </div>
          </Link>
        </div>

        {/* Utility */}
        <NavigationGroup>
          <NavigationItem
            label="Search"
            href="/search"
            icon={Search}
            active={isActive("/search")}
            onClick={onClose}
          />

          <NavigationItem
            label="Help & Support"
            href="/help"
            icon={LifeBuoy}
            active={isActive("/help")}
            onClick={onClose}
          />

          <NavigationItem
            label="Settings"
            href="/settings"
            icon={Settings}
            active={isActive("/settings")}
            onClick={onClose}
          />
        </NavigationGroup>
      </nav>

      {/* User */}
      <div className="border-t border-slate-200 p-3">
        <button className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-slate-50">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            A
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-800">
              Administrator
            </div>

            <div className="truncate text-xs text-slate-400">
              VenueOps Admin
            </div>
          </div>

          <ChevronRight size={16} className="text-slate-400" />
        </button>
      </div>
    </aside>
  );
}

function NavigationGroup({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {title && (
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          {title}
        </div>
      )}

      <div className="space-y-1">{children}</div>
    </div>
  );
}

function NavigationItem({
  label,
  href,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  href: string;
  icon: React.ElementType;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        group flex w-full items-center gap-3 rounded-xl px-3 py-2.5
        transition-all
        ${
          active
            ? "bg-slate-100 text-slate-950"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
        }
      `}
    >
      <Icon
        size={18}
        strokeWidth={active ? 2.2 : 1.8}
        className={
          active
            ? "text-slate-950"
            : "text-slate-400 group-hover:text-slate-700"
        }
      />

      <span className="text-[13px] font-medium">
        {label}
      </span>
    </Link>
  );
}

function SubNavigationItem({
  label,
  href,
  active,
  onClick,
}: {
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex w-full items-center rounded-lg px-3 py-2 text-[12px] transition-colors
        ${
          active
            ? "bg-slate-100 font-semibold text-slate-950"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        }
      `}
    >
      {label}
    </Link>
  );
}