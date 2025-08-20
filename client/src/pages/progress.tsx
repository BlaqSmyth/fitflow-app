import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  TrendingUp, 
  Calendar, 
  Flame, 
  Target,
  Award,
  Clock,
  BarChart3
} from "lucide-react";

export default function ProgressPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
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
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: progress } = useQuery({
    queryKey: ["/api/progress"],
    retry: false,
  });

  const { data: workoutSessions } = useQuery({
    queryKey: ["/api/sessions"],
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

  const recentSessions = workoutSessions?.slice(0, 5) || [];
  const totalWorkouts = progress?.totalWorkouts || 0;
  const totalCalories = progress?.totalCalories || 0;
  const workoutStreak = progress?.workoutStreak || 0;

  // Calculate weekly goal progress (assuming goal of 4 workouts per week)
  const weeklyGoal = 4;
  const weeklyProgress = Math.min((totalWorkouts % 7), weeklyGoal);
  const weeklyProgressPercent = (weeklyProgress / weeklyGoal) * 100;

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
          <h1 className="text-xl font-bold text-white">Progress</h1>
        </div>
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
          <BarChart3 className="h-5 w-5" />
        </Button>
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-surface border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-6 w-6 text-primary mr-2" />
                <span className="text-2xl font-bold text-primary">{totalWorkouts}</span>
              </div>
              <p className="text-sm text-slate-400">Total Workouts</p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="h-6 w-6 text-accent mr-2" />
                <span className="text-2xl font-bold text-accent">{totalCalories}</span>
              </div>
              <p className="text-sm text-slate-400">Calories Burned</p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-6 w-6 text-emerald-500 mr-2" />
                <span className="text-2xl font-bold text-emerald-500">{workoutStreak}</span>
              </div>
              <p className="text-sm text-slate-400">Day Streak</p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 text-purple-500 mr-2" />
                <span className="text-2xl font-bold text-purple-500">
                  {Math.floor((totalWorkouts * 30) / 60)}h
                </span>
              </div>
              <p className="text-sm text-slate-400">Total Time</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Goal */}
        <Card className="bg-surface border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Weekly Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Progress this week</span>
                <span className="text-white font-medium">{weeklyProgress}/{weeklyGoal} workouts</span>
              </div>
              <Progress value={weeklyProgressPercent} className="h-2" />
              <p className="text-xs text-slate-500">
                {weeklyProgress >= weeklyGoal 
                  ? "🎉 Great job! You've reached your weekly goal!" 
                  : `${weeklyGoal - weeklyProgress} more workouts to reach your goal`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-surface border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-accent" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No workouts completed yet</p>
                <p className="text-slate-500 text-sm">Start your first workout to see progress here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session, index) => (
                  <div key={session.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <span className="text-primary text-sm font-semibold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">Workout Session</p>
                        <p className="text-slate-400 text-sm">
                          {new Date(session.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {session.duration && (
                        <p className="text-accent text-sm font-medium">
                          {Math.floor(session.duration / 60)} min
                        </p>
                      )}
                      {session.caloriesBurned && (
                        <p className="text-slate-400 text-xs">
                          {session.caloriesBurned} cal
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="bg-surface border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center">
              <Award className="h-5 w-5 mr-2 text-emerald-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border-2 ${totalWorkouts >= 1 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 bg-slate-700/50'}`}>
                <div className="text-center">
                  <div className={`text-2xl mb-1 ${totalWorkouts >= 1 ? '' : 'grayscale'}`}>🏃</div>
                  <p className="text-xs font-medium text-white">First Workout</p>
                  <p className="text-xs text-slate-400">Complete 1 workout</p>
                </div>
              </div>

              <div className={`p-3 rounded-lg border-2 ${totalWorkouts >= 10 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 bg-slate-700/50'}`}>
                <div className="text-center">
                  <div className={`text-2xl mb-1 ${totalWorkouts >= 10 ? '' : 'grayscale'}`}>💪</div>
                  <p className="text-xs font-medium text-white">Getting Strong</p>
                  <p className="text-xs text-slate-400">Complete 10 workouts</p>
                </div>
              </div>

              <div className={`p-3 rounded-lg border-2 ${workoutStreak >= 7 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 bg-slate-700/50'}`}>
                <div className="text-center">
                  <div className={`text-2xl mb-1 ${workoutStreak >= 7 ? '' : 'grayscale'}`}>🔥</div>
                  <p className="text-xs font-medium text-white">Week Warrior</p>
                  <p className="text-xs text-slate-400">7 day streak</p>
                </div>
              </div>

              <div className={`p-3 rounded-lg border-2 ${totalCalories >= 1000 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 bg-slate-700/50'}`}>
                <div className="text-center">
                  <div className={`text-2xl mb-1 ${totalCalories >= 1000 ? '' : 'grayscale'}`}>🔥</div>
                  <p className="text-xs font-medium text-white">Calorie Crusher</p>
                  <p className="text-xs text-slate-400">Burn 1000 calories</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
