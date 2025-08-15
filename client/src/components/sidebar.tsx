import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: "fas fa-tachometer-alt",
      current: location === "/",
    },
    {
      name: "Register Service",
      href: "/register",
      icon: "fas fa-plus-circle",
      current: location === "/register",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: "fas fa-cogs",
      current: false,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: "fas fa-chart-line",
      current: false,
    },
  ];

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-slate-200 sidebar-transition">
      <div className="flex items-center h-16 px-6 border-b border-slate-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-project-diagram text-white text-sm"></i>
          </div>
          <h1 className="ml-3 text-xl font-bold text-slate-800">ServiceHub</h1>
        </div>
      </div>
      
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  item.current
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer"
                )}
              >
                <i className={cn(
                  item.icon,
                  "mr-3",
                  item.current ? "text-blue-500" : "text-slate-400"
                )}></i>
                {item.name}
              </div>
            </Link>
          ))}
        </div>
      </nav>

      <div className="absolute bottom-6 left-3 right-3">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-slate-600 text-sm"></i>
              </div>
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-slate-700">Admin User</p>
              <p className="text-xs text-slate-500">admin@company.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
