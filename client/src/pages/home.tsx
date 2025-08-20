import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Play, 
  Star, 
  Clock, 
  Flame, 
  Calendar, 
  TrendingUp,
  Dumbbell,
  Zap,
  Heart,
  Target,
  ClipboardList,
  BarChart3
} from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const { data: featuredWorkouts } = useQuery({
    queryKey: ["/api/workouts/featured"],
    retry: false,
  });

  const { data: progress } = useQuery({
    queryKey: ["/api/progress"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : user?.email?.[0]?.toUpperCase() || "U";

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "User";

  const todayProgress = progress?.totalWorkouts ? Math.min((progress.totalWorkouts % 10) * 10, 100) : 0;

  const categoryIcons = {
    'Mass': Dumbbell,
    'Lean': Zap,
    'Double': Target,
    'Classic': Heart,
  };

  const categoryColors = {
    'Mass': 'text-primary',
    'Lean': 'text-accent',
    'Double': 'text-emerald-500',
    'Classic': 'text-purple-500',
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-surface px-6 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{userInitials}</span>
          </div>
          <div>
            <p className="text-sm text-slate-400">Welcome back,</p>
            <p className="font-semibold text-white">{userName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <Calendar className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-white"
            onClick={() => window.location.href = '/api/logout'}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </Button>
        </div>
      </header>

      <main className="px-6 space-y-6">
        {/* Progress Overview */}
        <section className="mt-6">
          <Card className="bg-surface border-slate-700">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Today's Progress</h2>
                <span className="text-primary font-semibold">{todayProgress}%</span>
              </div>
              <Progress value={todayProgress} className="mb-4" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{progress?.totalWorkouts || 0}</p>
                  <p className="text-sm text-slate-400">Workouts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">{progress?.totalCalories || 0}</p>
                  <p className="text-sm text-slate-400">Calories</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-500">{progress?.workoutStreak || 0}</p>
                  <p className="text-sm text-slate-400">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Workout Categories */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-white">Workout Programs</h2>
          <div className="grid grid-cols-2 gap-4">
            {categories?.map((category) => {
              const IconComponent = categoryIcons[category.name as keyof typeof categoryIcons] || Dumbbell;
              const colorClass = categoryColors[category.name as keyof typeof categoryColors] || 'text-primary';
              
              return (
                <Link key={category.id} href={`/workouts?category=${category.id}`}>
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600 hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className={`w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center mx-auto mb-3`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-lg mb-1 text-white">{category.name}</h3>
                      <p className="text-slate-400 text-sm mb-2">{category.description}</p>
                      <p className={`${colorClass} text-sm font-semibold`}>View Workouts</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured Workouts */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Featured Workouts</h2>
            <Link href="/workouts">
              <Button variant="link" className="text-primary font-semibold p-0">View All</Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {featuredWorkouts?.slice(0, 2).map((workout) => (
              <Link key={workout.id} href={`/workout-player/${workout.id}`}>
                <Card className="bg-surface border-slate-700 overflow-hidden hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="aspect-video bg-slate-700 relative">
                    {workout.thumbnailUrl && (
                      <img 
                        src={workout.thumbnailUrl} 
                        alt={workout.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-white ml-1" />
                      </div>
                    </div>
                    <Badge className="absolute top-4 right-4 bg-primary text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.floor(workout.duration / 60)} min
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-1 text-white">{workout.title}</h3>
                    <p className="text-slate-400 text-sm mb-2">{workout.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                          {workout.difficulty}
                        </Badge>
                        {workout.calories && (
                          <div className="flex items-center text-slate-400 text-sm">
                            <Flame className="w-3 h-3 mr-1" />
                            {workout.calories} cal
                          </div>
                        )}
                      </div>
                      {workout.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium text-white">{workout.rating}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-white">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/workout-sheet">
              <Card className="bg-surface border-slate-700 hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Workout Sheet</p>
                      <p className="text-slate-400 text-sm">Track exercises</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/progress">
              <Card className="bg-surface border-slate-700 hover:border-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Progress</p>
                      <p className="text-slate-400 text-sm">View stats</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
