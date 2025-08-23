import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { Link } from "wouter";
import type { Workout } from "@shared/schema";

export default function Calendar() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [weight, setWeight] = useState("");

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

  const { data: workouts = [] } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  // Organize workouts by week and day
  const organizeWorkouts = () => {
    const workoutsByWeek: { [key: number]: Workout[] } = {};
    
    workouts.forEach(workout => {
      const weekNum = workout.weekNumber;
      if (weekNum) {
        if (!workoutsByWeek[weekNum]) {
          workoutsByWeek[weekNum] = [];
        }
        workoutsByWeek[weekNum].push(workout);
      }
    });

    // Sort workouts within each week by day number
    Object.keys(workoutsByWeek).forEach(week => {
      workoutsByWeek[parseInt(week)].sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));
    });

    return workoutsByWeek;
  };

  const workoutsByWeek = organizeWorkouts();
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Get workout name for display (remove "Day X: " prefix)
  const getWorkoutDisplayName = (title: string) => {
    return title.replace(/^Day \d+: /, "");
  };

  // Define blocks
  const blocks = [
    { name: "BLOCK 1", weeks: [1, 2, 3, 4], color: "bg-orange-600" },
    { name: "BLOCK 2", weeks: [5, 6, 7, 8], color: "bg-orange-600" },
    { name: "BLOCK 3", weeks: [9, 10, 11, 12, 13], color: "bg-orange-600" }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-surface px-6 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-white">90-Day Challenge Calendar</h1>
        </div>
        <CalendarIcon className="w-6 h-6 text-primary" />
      </header>

      <main className="px-4 py-6">
        {/* Personal Info Section */}
        <Card className="bg-surface border-slate-700 mb-6">
          <CardHeader>
            <h2 className="text-lg font-bold text-white">Challenge Setup</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-white">Start Date:</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFat" className="text-white">Body Fat %:</Label>
                <Input
                  id="bodyFat"
                  type="number"
                  placeholder="e.g., 15"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-white">Weight:</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="e.g., 180"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Blocks */}
        {blocks.map((block, blockIndex) => (
          <Card key={blockIndex} className="bg-surface border-slate-700 mb-6 overflow-hidden">
            {/* Block Header */}
            <div className={`${block.color} px-4 py-3`}>
              <h2 className="text-xl font-bold text-white">{block.name}</h2>
            </div>

            {/* Days Header */}
            <div className="bg-slate-800 grid grid-cols-8 border-b border-slate-600">
              <div className="p-3 font-semibold text-white border-r border-slate-600">Week</div>
              {dayNames.map((day) => (
                <div key={day} className="p-3 font-semibold text-white text-center border-r border-slate-600 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Week Rows */}
            {block.weeks.map((weekNum) => {
              const weekWorkouts = workoutsByWeek[weekNum] || [];
              return (
                <div key={weekNum} className="grid grid-cols-8 border-b border-slate-600 last:border-b-0">
                  <div className="p-3 font-semibold text-white bg-slate-700 border-r border-slate-600">
                    Week {weekNum}
                  </div>
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const workout = weekWorkouts[dayIndex];
                    return (
                      <div 
                        key={dayIndex} 
                        className="p-3 text-center border-r border-slate-600 last:border-r-0 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        {workout ? (
                          <Link href={`/workout-player/${workout.id}`}>
                            <div className="cursor-pointer">
                              <span className="text-sm font-medium text-slate-900 dark:text-white">
                                {getWorkoutDisplayName(workout.title)}
                              </span>
                            </div>
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-sm">Rest</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </Card>
        ))}

        {/* Info Panel */}
        <Card className="bg-surface border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-white font-semibold mb-2">📋 Calendar Guide</h3>
            <div className="text-slate-300 text-sm space-y-2">
              <p>• <strong>90-Day Challenge:</strong> Complete workouts for 13 weeks</p>
              <p>• <strong>4 Workout Types:</strong> Strength, Cardio, Flexibility, HIIT</p>
              <p>• <strong>Progressive Difficulty:</strong> Beginner → Intermediate → Advanced</p>
              <p>• <strong>Click any workout</strong> to start your session</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}