import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import { 
  Play, 
  Star, 
  Clock, 
  Flame, 
  ArrowLeft,
  Filter,
  Search,
  Heart
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Workout } from "@shared/schema";

export default function Workouts() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

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

  // Sort workouts by day number (1 to 90) and filter by search
  const filteredWorkouts = workouts
    .filter((workout: Workout) =>
      workout.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workout.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));

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
          <h1 className="text-xl font-bold text-white">Workouts</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <Filter className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search workouts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-surface border-slate-600 text-white placeholder-slate-400"
          />
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            90-Day Challenge ({filteredWorkouts.length} workouts)
          </h2>
          <Badge variant="outline" className="border-primary text-primary">
            Day 1 - Day 90
          </Badge>
        </div>

        {/* Workout Grid */}
        <div className="mt-6">
          <div className="space-y-4">
              {filteredWorkouts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-lg">No workouts found</p>
                  <p className="text-slate-500 text-sm mt-2">Try adjusting your search or category filter</p>
                </div>
              ) : (
                filteredWorkouts.map((workout) => (
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
                        <div className="absolute top-4 right-4 flex gap-2">
                          <Badge className="bg-primary text-white">
                            <Clock className="w-3 h-3 mr-1" />
                            {Math.floor(workout.duration / 60)} min
                          </Badge>
                        </div>
                        <div className="absolute top-4 left-4">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="bg-black/50 hover:bg-black/70 text-white rounded-full"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Handle favorite toggle
                            }}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-white">{workout.title}</h3>
                          {workout.rating && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium text-white">{workout.rating}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm mb-3">{workout.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                              Day {workout.dayNumber}
                            </Badge>
                            <Badge variant="outline" className="border-slate-600 text-slate-300">
                              {workout.difficulty}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-3">
                            {workout.calories && (
                              <div className="flex items-center text-slate-400 text-sm">
                                <Flame className="w-3 h-3 mr-1" />
                                {workout.calories}
                              </div>
                            )}
                            {workout.instructor && (
                              <span className="text-slate-400 text-sm">{workout.instructor}</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
          </div>
        </div>
      </main>
    </div>
  );
}
