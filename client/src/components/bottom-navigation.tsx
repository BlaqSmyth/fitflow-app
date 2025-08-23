import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Home, 
  Play, 
  Calendar,
  BarChart3, 
  User 
} from "lucide-react";

export default function BottomNavigation() {
  const [location, navigate] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Play, label: "Workouts", path: "/workouts" },
    { icon: Calendar, label: "Calendar", path: "/calendar" },
    { icon: BarChart3, label: "Progress", path: "/progress" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-slate-700 px-6 py-4 z-40">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center space-y-1 p-2 h-auto ${
                isActive 
                  ? 'text-primary' 
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => navigate(item.path)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
