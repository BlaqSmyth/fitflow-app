import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import VimeoPlayer from "@/components/vimeo-player";
import { 
  X, 
  Heart, 
  Clock, 
  Flame, 
  Target,
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize,
  Volume2
} from "lucide-react";
import type { Workout } from "@shared/schema";

// Utility function to extract Vimeo video ID from URL
function extractVimeoId(url: string): string {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /^(\d+)$/ // Direct ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return url; // Return original if no pattern matches
}

export default function WorkoutPlayer() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const workoutId = location.split('/')[2];
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);

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

  const { data: workout, isLoading: workoutLoading } = useQuery<Workout>({
    queryKey: ["/api/workouts", workoutId],
    retry: false,
    enabled: !!workoutId,
  });

  const { data: favoriteData } = useQuery<{ isFavorited: boolean }>({
    queryKey: ["/api/favorites", workoutId, "check"],
    retry: false,
    enabled: !!workoutId,
  });
  
  const isFavorited = favoriteData?.isFavorited || false;

  const createSessionMutation = useMutation({
    mutationFn: async (workoutId: string) => {
      const response = await apiRequest("POST", "/api/sessions", { workoutId });
      return response.json();
    },
    onSuccess: (data) => {
      setActiveSession(data.id);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to start workout session",
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorited?.isFavorited) {
        await apiRequest("DELETE", `/api/favorites/${workoutId}`);
      } else {
        await apiRequest("POST", "/api/favorites", { workoutId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", workoutId, "check"] });
      toast({
        title: isFavorited?.isFavorited ? "Removed from favorites" : "Added to favorites",
        description: workout?.title,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (workout && !activeSession) {
      createSessionMutation.mutate(workout.id);
    }
  }, [workout]);

  if (isLoading || workoutLoading || !workout) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  const handleClose = () => {
    navigate(-1);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRewind = () => {
    setCurrentTime(Math.max(0, currentTime - 10));
  };

  const handleForward = () => {
    setCurrentTime(Math.min(workout.duration, currentTime + 10));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = workout.duration > 0 ? (currentTime / workout.duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative h-full flex flex-col">
        {/* Video Container */}
        <div className="relative flex-1 bg-black">
          <VimeoPlayer
            vimeoId={workout.vimeoId || extractVimeoId(workout.videoUrl)}
            onProgress={(progress) => {
              setCurrentTime((progress / 100) * workout.duration);
            }}
            onStart={() => {
              if (!activeSession && workout.id) {
                createSessionMutation.mutate(workout.id);
              }
            }}
            onEnd={() => {
              if (activeSession) {
                completeSessionMutation.mutate(activeSession);
              }
            }}
            className="w-full h-full"
            autoplay={false}
          />
          
          {/* Video Controls Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60">
            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={handleClose}
              >
                <X className="h-6 w-6" />
              </Button>
              <div className="text-center">
                <p className="text-white font-semibold">{workout.title}</p>
                <p className="text-white/75 text-sm">{workout.instructor}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Center Play/Pause */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="w-20 h-20 bg-black/50 hover:bg-black/70 rounded-full text-white"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </Button>
            </div>
            
            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4">
              {/* Progress Bar */}
              <div className="flex items-center space-x-2 text-white text-sm">
                <span>{formatTime(currentTime)}</span>
                <Progress value={progress} className="flex-1" />
                <span>{formatTime(workout.duration)}</span>
              </div>
              
              {/* Control Buttons */}
              <div className="flex justify-center items-center space-x-6">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={handleRewind}
                >
                  <SkipBack className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 bg-primary hover:bg-primary/90 rounded-full text-white"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-1" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={handleForward}
                >
                  <SkipForward className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Workout Info Panel */}
        <div className="bg-surface max-h-1/3 overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1 text-white">{workout.title}</h2>
                <p className="text-slate-400">{workout.description}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`ml-4 ${isFavorited?.isFavorited ? 'text-red-500' : 'text-slate-400'} hover:text-red-500`}
                onClick={() => toggleFavoriteMutation.mutate()}
                disabled={toggleFavoriteMutation.isPending}
              >
                <Heart className={`h-6 w-6 ${isFavorited?.isFavorited ? 'fill-current' : ''}`} />
              </Button>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-slate-400">Duration</p>
                <p className="font-semibold text-white">{Math.floor(workout.duration / 60)} min</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400">Calories</p>
                <p className="font-semibold text-white">{workout.calories || 'N/A'}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400">Level</p>
                <p className="font-semibold text-white">{workout.difficulty}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400">Equipment</p>
                <p className="font-semibold text-white">{workout.equipment || 'None'}</p>
              </div>
            </div>
            
            {workout.exercises && workout.exercises.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-white">Exercise List</h3>
                {workout.exercises.map((workoutExercise, index) => (
                  <div key={workoutExercise.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <span className="text-primary text-sm font-semibold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{workoutExercise.exercise.name}</p>
                        <p className="text-slate-400 text-sm">
                          {workoutExercise.sets && workoutExercise.reps 
                            ? `${workoutExercise.sets} sets × ${workoutExercise.reps} reps`
                            : workoutExercise.duration 
                            ? `${Math.floor(workoutExercise.duration / 60)}:${(workoutExercise.duration % 60).toString().padStart(2, '0')}`
                            : 'Follow along'
                          }
                        </p>
                      </div>
                    </div>
                    {workoutExercise.duration && (
                      <span className="text-accent text-sm">{Math.floor(workoutExercise.duration / 60)}:{(workoutExercise.duration % 60).toString().padStart(2, '0')}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
