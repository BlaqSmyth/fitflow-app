import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Settings, 
  User, 
  Heart, 
  Calendar, 
  Target,
  LogOut,
  Edit,
  Mail,
  Shield
} from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        navigate("/login");
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, navigate]);

  const { data: progress } = useQuery({
    queryKey: ["/api/progress"],
    retry: false,
  });

  const { data: favorites } = useQuery({
    queryKey: ["/api/favorites"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  const handleGoBack = () => {
    navigate("/");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : user?.email?.[0]?.toUpperCase() || "U";

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "User";

  const memberSince = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'Recently';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-surface px-6 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-white"
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">Profile</h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-slate-400 hover:text-white"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* Profile Header */}
        <Card className="bg-surface border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user?.profileImageUrl} alt={userName} />
                <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-white text-xl font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">{userName}</h2>
                <div className="flex items-center text-slate-400 text-sm mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Member since {memberSince}
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <Shield className="h-3 w-3 mr-1" />
                  Premium Member
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-surface border-slate-700">
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{progress?.totalWorkouts || 0}</p>
              <p className="text-xs text-slate-400">Workouts</p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-slate-700">
            <CardContent className="p-4 text-center">
              <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-500">{favorites?.length || 0}</p>
              <p className="text-xs text-slate-400">Favorites</p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-slate-700">
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-500">{progress?.workoutStreak || 0}</p>
              <p className="text-xs text-slate-400">Day Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Account Information */}
        <Card className="bg-surface border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center">
              <User className="h-5 w-5 mr-2" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-700">
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-slate-400 mr-3" />
                <span className="text-slate-400">Email</span>
              </div>
              <span className="text-white">{user?.email || 'Not provided'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700">
              <div className="flex items-center">
                <User className="h-4 w-4 text-slate-400 mr-3" />
                <span className="text-slate-400">First Name</span>
              </div>
              <span className="text-white">{user?.firstName || 'Not provided'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <User className="h-4 w-4 text-slate-400 mr-3" />
                <span className="text-slate-400">Last Name</span>
              </div>
              <span className="text-white">{user?.lastName || 'Not provided'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Favorite Workouts */}
        {favorites && favorites.length > 0 && (
          <Card className="bg-surface border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-500" />
                Favorite Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {favorites.slice(0, 3).map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0">
                    <div>
                      <p className="font-medium text-white">{workout.title}</p>
                      <p className="text-slate-400 text-sm">{Math.floor(workout.duration / 60)} minutes</p>
                    </div>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {workout.difficulty}
                    </Badge>
                  </div>
                ))}
                {favorites.length > 3 && (
                  <Button variant="link" className="text-primary p-0 h-auto font-normal">
                    View all {favorites.length} favorites
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings & Actions */}
        <Card className="bg-surface border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Settings & Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
              <Settings className="h-4 w-4 mr-3" />
              Preferences
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
              <Shield className="h-4 w-4 mr-3" />
              Privacy & Security
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
              <Mail className="h-4 w-4 mr-3" />
              Contact Support
            </Button>
            <div className="pt-2 border-t border-slate-700">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
