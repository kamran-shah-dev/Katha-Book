import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import {
  LayoutDashboard,
  Users,
  BookOpen,
  Truck,
  FileText,
  FolderSearch,
  Wrench,
  LogOut,
} from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { logout } = useAuth();
  const location = useLocation();

  // Dropdown states for Reports & Utility
  const [openReports, setOpenReports] = useState(false);
  const [openUtility, setOpenUtility] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },

    { name: "Accounts", icon: Users, path: "/accounts" },

    { name: "Cashbook", icon: BookOpen, path: "/cashbook" },

    { name: "Goods Received", icon: Truck, path: "/goods-received" },

    { name: "Export", icon: FolderSearch, path: "/export" },

    { name: "Invoice", icon: FileText, path: "/invoice" },

    {
      name: "Reports",
      icon: BookOpen,
      toggle: () => setOpenReports(!openReports),
      open: openReports,
      children: [
        { name: "Cashbook Report", path: "/reports/cashbook" },
        { name: "Account Ledger", path: "/reports/ledger" },
        { name: "Credit & Debit Report", path: "/reports/credit-debit" },
        { name: "Parties Report", path: "/reports/parties" },
      ],
    },

    {
      name: "Utility",
      icon: Wrench,
      toggle: () => setOpenUtility(!openUtility),
      open: openUtility,
      children: [
        { name: "Data Import", path: "/utility/import" }
      ],
    },
  ];

  return (
    <div className="flex min-h-screen">

      {/* LEFT SIDEBAR */}
      <aside className="w-64 h-screen fixed left-0 top-0 bg-[#3B2F2F] text-[#EEDFCC] flex flex-col shadow-xl overflow-hidden">

        {/* LOGO */}
        <div className="p-6 text-2xl font-bold border-b border-[#6F4E37]">
          <img src="/logo.jpeg" alt="Katha Book Logo" className="h-12 w-32 mx-auto" />
        </div>

        {/* MENU ITEMS */}
        <nav className="flex-1">
          <ul className="space-y-1 p-3">

            {menuItems.map((item) => {
              const Icon = item.icon;

              const isActiveParent =
                item.children?.some((child) => location.pathname === child.path);

              // Handle items with children (dropdown)
              if (item.children) {
                return (
                  <li key={item.name}>
                    <button
                      onClick={item.toggle}
                      className={`flex w-full items-center justify-between gap-3 p-3 rounded-md transition-all
                        ${isActiveParent ? "bg-[#5C4033] text-white" : "hover:bg-[#4A352D]"}
                      `}
                    >
                      <span className="flex items-center gap-3">
                        <Icon size={20} />
                        {item.name}
                      </span>

                      <span>{item.open ? "▾" : "▸"}</span>
                    </button>

                    {/* Submenu */}
                    {item.open && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => {
                          const activeChild = location.pathname === child.path;

                          return (
                            <li key={child.path}>
                              <Link
                                to={child.path}
                                className={`block p-2 rounded-md text-sm transition
                                  ${
                                    activeChild
                                      ? "bg-[#6F4E37] text-white"
                                      : "hover:bg-[#4A352D]"
                                  }
                                `}
                              >
                                {child.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              // Normal (non-dropdown) menu items
              const active = location.pathname === item.path;

              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 p-3 rounded-md transition-all
                      ${
                        active
                          ? "bg-[#5C4033] text-white"
                          : "hover:bg-[#4A352D]"
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}

          </ul>
        </nav>

        {/* LOGOUT BUTTON */}
        <button
          onClick={logout}
          className="m-3 flex items-center gap-3 p-3 rounded-md bg-[#5C4033] text-white hover:bg-[#4A352D] transition"
        >
          <LogOut size={20} />
          Logout
        </button>

      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 p-6 bg-background">
        {children}
      </main>
    </div>
  );
}
