import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import type { User, Workout, UserChallenge } from "@shared/schema";

interface UserProgress {
  totalWorkouts: number;
  totalCalories: number;
  workoutStreak: number;
  completedToday: boolean;
}

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


  const { data: featuredWorkouts = [] } = useQuery<Workout[]>({
    queryKey: ["/api/workouts/featured"],
    retry: false,
  });

  const { data: progress = { totalWorkouts: 0, totalCalories: 0, workoutStreak: 0, completedToday: false } } = useQuery<UserProgress>({
    queryKey: ["/api/progress"],
    retry: false,
  });

  const { data: challenge } = useQuery<UserChallenge | null>({
    queryKey: ["/api/challenge"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: todaysWorkout } = useQuery<Workout | null>({
    queryKey: ["/api/challenge/today"],
    retry: false,
    enabled: !!challenge && isAuthenticated,
  });

  const queryClient = useQueryClient();

  const startChallengeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/challenge/start", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Challenge Started!",
        description: "Your 90-day fitness journey begins now!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/challenge"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenge/today"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start challenge. Please try again.",
        variant: "destructive",
      });
    }
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

  const todayProgress = progress.totalWorkouts ? Math.min((progress.totalWorkouts % 10) * 10, 100) : 0;

  // Calculate challenge progress
  const challengeProgress = challenge 
    ? {
        currentDay: challenge.currentDay,
        completedDays: challenge.completedDays?.length || 0,
        daysRemaining: 90 - (challenge.completedDays?.length || 0),
        progressPercentage: ((challenge.completedDays?.length || 0) / 90) * 100,
        isCompleted: challenge.completedAt !== null,
        daysSinceStart: Math.floor((Date.now() - new Date(challenge.startDate).getTime()) / (24 * 60 * 60 * 1000)) + 1
      }
    : null;

  const difficultyColors = {
    'beginner': 'text-emerald-500',
    'intermediate': 'text-accent',
    'advanced': 'text-primary',
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
        {/* 90-Day Challenge Overview */}
        <section className="mt-6">
          {!challenge ? (
            // Challenge Start Card
            <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Ready to Transform?</h2>
                  <p className="text-slate-300 mb-6">Join the P90X3 90-Day Challenge • 30 minutes daily</p>
                </div>
                <Button 
                  onClick={() => startChallengeMutation.mutate()}
                  disabled={startChallengeMutation.isPending}
                  className="bg-gradient-to-r from-primary to-accent text-white px-8 py-3 text-lg"
                  data-testid="button-start-challenge"
                >
                  {startChallengeMutation.isPending ? (
                    "Starting Challenge..."
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Start 90-Day Challenge
                    </>
                  )}
                </Button>
                <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                  <div>
                    <p className="text-xl font-bold text-primary">90</p>
                    <p className="text-sm text-slate-400">Days Total</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-accent">30</p>
                    <p className="text-sm text-slate-400">Min/Day</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-emerald-500">13</p>
                    <p className="text-sm text-slate-400">Weeks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Active Challenge Card
            <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">90-Day Challenge</h2>
                    <p className="text-sm text-slate-300">Day {challengeProgress?.currentDay} • {challengeProgress?.daysRemaining} days remaining</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary" data-testid="text-days-completed">
                      {challengeProgress?.completedDays}/90
                    </p>
                    <p className="text-sm text-slate-300">Days Complete</p>
                  </div>
                </div>
                <Progress value={challengeProgress?.progressPercentage || 0} className="mb-4" />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{challengeProgress?.currentDay}</p>
                    <p className="text-sm text-slate-400">Current Day</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{progress.totalCalories}</p>
                    <p className="text-sm text-slate-400">Calories Burned</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-500">{Math.ceil((challengeProgress?.daysRemaining || 0) / 7)}</p>
                    <p className="text-sm text-slate-400">Weeks Left</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>


        {/* Today's Workout */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Today's Workout</h2>
            {challenge && challengeProgress && (
              <Badge className="bg-primary/20 text-primary">
                Day {challengeProgress.currentDay}
              </Badge>
            )}
          </div>
          
          {challenge && todaysWorkout ? (
            <Link href={`/workout-player/${todaysWorkout.id}`}>
              <Card className="bg-surface border-slate-700 overflow-hidden hover:border-primary/50 transition-colors cursor-pointer" data-testid="card-todays-workout">
                <div className="aspect-video bg-slate-700 relative">
                  {todaysWorkout.thumbnailUrl && (
                    <img 
                      src={todaysWorkout.thumbnailUrl} 
                      alt={todaysWorkout.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.floor(todaysWorkout.duration / 60)} min
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg text-white mb-2" data-testid="text-workout-title">
                    {todaysWorkout.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-3">{todaysWorkout.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {todaysWorkout.difficulty}
                    </Badge>
                    <div className="flex items-center space-x-3">
                      {todaysWorkout.calories && (
                        <div className="flex items-center text-slate-400 text-sm">
                          <Flame className="w-3 h-3 mr-1" />
                          {todaysWorkout.calories}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card className="bg-surface border-slate-700">
              <CardContent className="p-6 text-center">
                {!challenge ? (
                  <>
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2">Start Your 90-Day Challenge</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Begin your fitness transformation with our P90X3-inspired workout program
                    </p>
                    <Button 
                      onClick={() => startChallengeMutation.mutate()}
                      disabled={startChallengeMutation.isPending}
                      className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                      data-testid="button-start-challenge"
                    >
                      {startChallengeMutation.isPending ? "Starting..." : "Start Challenge"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2">No Workout Today</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Check back later or explore our featured workouts below
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </section>

        {/* Featured Workouts */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Featured Workouts</h2>
            <Link href="/workouts">
              <Button variant="link" className="text-primary font-semibold p-0">View All</Button>
            </Link>
          </div>
          
          {featuredWorkouts.length > 0 && (
            <Link href={`/workout-player/${featuredWorkouts[0].id}`}>
              <Card className="bg-surface border-slate-700 overflow-hidden hover:border-primary/50 transition-colors cursor-pointer">
                <div className="aspect-video bg-slate-700 relative">
                  {featuredWorkouts[0].thumbnailUrl && (
                    <img 
                      src={featuredWorkouts[0].thumbnailUrl} 
                      alt={featuredWorkouts[0].title}
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
                    {Math.floor(featuredWorkouts[0].duration / 60)} min
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-1 text-white">{featuredWorkouts[0].title}</h3>
                  <p className="text-slate-400 text-sm mb-2">{featuredWorkouts[0].description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                        {featuredWorkouts[0].difficulty}
                      </Badge>
                      {featuredWorkouts[0].calories && (
                        <div className="flex items-center text-slate-400 text-sm">
                          <Flame className="w-3 h-3 mr-1" />
                          {featuredWorkouts[0].calories} cal
                        </div>
                      )}
                    </div>
                    {featuredWorkouts[0].rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-white">{featuredWorkouts[0].rating}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
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
