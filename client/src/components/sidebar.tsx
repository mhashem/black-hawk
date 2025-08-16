import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: "fas fa-tachometer-alt",
      current: location === "/",
      show: isAuthenticated,
    },
    {
      name: "Register Service",
      href: "/register",
      icon: "fas fa-plus-circle",
      current: location === "/register",
      show: isAdmin,
    },
    {
      name: "User Management",
      href: "/users",
      icon: "fas fa-users",
      current: location === "/users",
      show: isAdmin,
    },
  ].filter(item => item.show);

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
        {isAuthenticated ? (
          <>
            <div className="bg-slate-50 rounded-lg p-4 mb-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                      <i className="fas fa-user text-slate-600 text-sm"></i>
                    </div>
                  )}
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email?.split('@')[0] || 'User'
                    }
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  <div className="flex items-center mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user?.role === 'admin' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user?.role === 'admin' ? 'Admin' : 'Viewer'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => window.location.href = '/api/logout'}
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Sign Out
            </Button>
          </>
        ) : (
          <Button 
            className="w-full"
            onClick={() => window.location.href = '/api/login'}
          >
            <i className="fas fa-sign-in-alt mr-2"></i>
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
}
