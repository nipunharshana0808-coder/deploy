/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Home, 
  LayoutDashboard, 
  UserPlus, 
  Search, 
  Settings, 
  LogOut, 
  ShieldAlert, 
  Menu, 
  X, 
  Activity,
  Trash2
} from "lucide-react";
import { UserAccount } from "../types";

export type MenuType = "Home" | "Dashboard" | "Add Patient" | "Search Records" | "Settings" | "Trash";

interface SidebarProps {
  activeMenu: MenuType;
  onChangeMenu: (menu: MenuType) => void;
  currentUser: UserAccount;
  onSignOut: () => void;
}

export default function Sidebar({ activeMenu, onChangeMenu, currentUser, onSignOut }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { name: "Home" as MenuType, icon: Home },
    { name: "Dashboard" as MenuType, icon: LayoutDashboard },
    { name: "Add Patient" as MenuType, icon: UserPlus },
    { name: "Search Records" as MenuType, icon: Search },
    { name: "Trash" as MenuType, icon: Trash2 },
    { name: "Settings" as MenuType, icon: Settings },
  ];


  const handleMenuClick = (menu: MenuType) => {
    onChangeMenu(menu);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile top-bar */}
      <div className="lg:hidden flex items-center gap-2 glass-header px-4 py-3 sticky top-0 z-30 transition-colors duration-200">
        <button
          id="btn-mobile-menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-650 dark:text-slate-300 hover:bg-natural-hover dark:hover:bg-slate-755 hover-scale"
          aria-label="Toggle sidebar"
          aria-expanded={mobileOpen}
        >
          <span className="hamburger-btn" data-open={mobileOpen ? "true" : "false"}>
            <span /><span /><span />
          </span>
        </button>
        <div className="h-8 w-8 bg-natural-accent rounded-lg flex items-center justify-center text-white">
          <Activity className="h-5 w-5 animate-pulse" />
        </div>
        <span className="font-bold text-[#4A5444] dark:text-white ">AI DMS</span>
      </div>

      {/* Sidebar background wrapper */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] glass-sidebar flex flex-col justify-between p-5 lg:translate-x-0 lg:static lg:h-screen drawer-slide-in
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `} style={mobileOpen ? undefined : { animation: "none" }}>
        {/* Header Branding */}
        <div>
          <div className="flex items-center justify-between lg:justify-start gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="premium-icon-tile h-10 w-10 bg-natural-accent rounded-xl flex items-center justify-center text-white shadow-sm">
                <Activity className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h1 className="font-bold text-natural-accent-dark text-base tracking-tight leading-none">AI DMS</h1>
              </div>
            </div>
            <button className="lg:hidden text-natural-accent hover:text-natural-accent-dark dark:text-white" onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6 rounded-2xl border border-white/10 bg-white/20 dark:bg-slate-950/30 p-4 text-sm text-slate-700 dark:text-slate-200">
            <p className="font-semibold text-slate-900 dark:text-white">Signed in as</p>
            <p className="mt-1 truncate font-bold">{currentUser.name}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{currentUser.role === 'admin' ? 'Administrator' : 'Clinician'}</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 stagger">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.name;
              return (
                <button
                  id={`nav-item-${item.name.toLowerCase().replace(" ", "-")}`}
                  key={item.name}
                  onClick={() => handleMenuClick(item.name)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-left cursor-pointer
                    hover-lift ripple-on-click
                    ${isActive
                      ? "bg-natural-accent text-white font-semibold shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-natural-hover hover:text-natural-accent-dark dark:hover:text-white"
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "icon-spin-hover" : ""}`} />
                  <span className="tab-underline">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="space-y-3 pt-4 border-t border-natural-border">
          <button
            id="btn-signout"
            onClick={onSignOut}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-405 bg-white/60 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-955/45 border border-natural-border cursor-pointer text-left hover-lift ripple-on-click"
          >
            <span className="flex items-center gap-2">
              <LogOut className="h-3.5 w-3.5 icon-spin-hover" />
              <span>Sign out Session</span>
            </span>
            <span className="text-[10px] opacity-60">ESC</span>
          </button>
        </div>
      </aside>

      {/* Mobile backdrop slide-out catcher */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)} 
          className="fixed inset-0 bg-slate-950/60 lg:hidden z-40 transition-opacity"
        />
      )}
    </>
  );
}
