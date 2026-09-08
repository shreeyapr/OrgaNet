"use client";

import { useState } from "react";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Mobile overlay */}
        {sidebarOpen && (
          <button
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/20 lg:hidden"
          />
        )}

        {/* Main application */}
        <div className="min-w-0 flex-1">

          <Header
            onMenuClick={() => setSidebarOpen(true)}
          />

          <main className="min-w-0">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}