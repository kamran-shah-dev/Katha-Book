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

  const [openReports, setOpenReports] = useState(false);
  const [openUtility, setOpenUtility] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Accounts", icon: Users, path: "/accounts" },
    { name: "Cashbook", icon: BookOpen, path: "/cashbook" },
    { name: "Import", icon: Truck, path: "/goods-received" },
    { name: "Export", icon: FolderSearch, path: "/export" },

    {
      name: "Reports",
      icon: BookOpen,
      toggle: () => setOpenReports(!openReports),
      open: openReports,
      children: [
        { name: "Cashbook Report", path: "/reports/cashbook" },
        { name: "Account Ledger", path: "/reports/ledger" },
        { name: "Credit & Debit Report", path: "/reports/credit-debit" }
        // { name: "Parties Report", path: "/reports/parties" }
      ],
    },

    // {
    //   name: "Utility",
    //   icon: Wrench,
    //   toggle: () => setOpenUtility(!openUtility),
    //   open: openUtility,
    //   children: [{ name: "Data Import", path: "/utility/import" }],
    // },
  ];

  return (
    <div className="flex min-h-screen">

      {/* LEFT SIDEBAR */}
      <aside className="w-64 h-screen fixed left-0 top-0 bg-[#3B2F2F] text-[#EEDFCC] flex flex-col shadow-xl overflow-hidden">

        <div className="p-6 text-2xl font-bold border-4 border-[#6F4E37] bg-white">
          <img src="/logo.jpeg" alt="Katha Book Logo" className="h-12 w-32 mx-auto" />
        </div>

        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1 p-3">

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActiveParent =
                item.children?.some((child) => location.pathname === child.path);

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

              const active = location.pathname === item.path;

              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 p-3 rounded-md transition-all
                      ${active ? "bg-[#5C4033] text-white" : "hover:bg-[#4A352D]"}
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

        <button
          onClick={logout}
          className="m-3 flex items-center gap-3 p-3 rounded-md bg-[#5C4033] text-white hover:bg-[#4A352D] transition"
        >
          <LogOut size={20} />
          Logout
        </button>

      </aside>

      {/* MAIN CONTENT AREA + FOOTER */}
      <div className="flex flex-col flex-1 ml-64 min-h-screen">

        <main className="flex-1 p-6 bg-background overflow-auto">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="bg-[#3B2F2F] text-[#EEDFCC] text-center py-3 border-t border-[#6F4E37]">
          <span>
            Developed By:{" "}
            <a
              href="https://addsmint.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              AddsMint.com
            </a>
            {" "} - Helpline{" "}
            <a href="tel:+923172525091" className="underline hover:text-white">
              +92 317 2525091
            </a>
          </span>
        </footer>


      </div>

    </div>
  );
}
