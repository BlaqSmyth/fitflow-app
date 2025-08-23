import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import VimeoPlayer from "@/components/vimeo-player";
import { 
  X, 
  Heart, 
  Clock, 
  Flame, 
  Target,
  ArrowLeft
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
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Get workout ID from URL
  const workoutId = window.location.pathname.split('/').pop();

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

  const { data: activeSession } = useQuery<{ id: string }>({
    queryKey: ["/api/sessions/active"],
    retry: false,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (workoutId: string) => {
      const response = await apiRequest("POST", "/api/sessions", {
        workoutId,
        startTime: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
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
      console.error("Error creating workout session:", error);
    },
  });

  const completeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest("PUT", `/api/sessions/${sessionId}/complete`, {
        duration: workout?.duration || 1800,
        caloriesBurned: workout?.calories || 200,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
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
      console.error("Error completing workout session:", error);
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        await apiRequest("DELETE", `/api/favorites/${workoutId}`);
      } else {
        await apiRequest("POST", "/api/favorites", { workoutId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", workoutId, "check"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: isFavorited ? "Removed from favorites" : "Added to favorites",
        description: isFavorited ? "Workout removed from your favorites" : "Workout added to your favorites",
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
        description: "Failed to update favorites",
        variant: "destructive",
      });
    },
  });

  if (isLoading || workoutLoading || !workout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const handleClose = () => {
    navigate("/workouts");
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative h-full flex flex-col">
        {/* Header with close button and workout info */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex justify-between items-center">
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
            className={`${isFavorited ? 'text-red-500' : 'text-white'} hover:text-red-500`}
            onClick={() => toggleFavoriteMutation.mutate()}
            disabled={toggleFavoriteMutation.isPending}
          >
            <Heart className={`h-6 w-6 ${isFavorited ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Video Container - Full screen with bottom padding for controls */}
        <div className="relative flex-1 bg-black">
          <VimeoPlayer
            vimeoId={workout.vimeoId || extractVimeoId(workout.videoUrl)}
            onProgress={(progress) => {
              setCurrentTime((progress / 100) * workout.duration);
            }}
            onStart={() => {
              setIsPlaying(true);
              if (!activeSession && workout.id) {
                createSessionMutation.mutate(workout.id);
              }
            }}
            onEnd={() => {
              setIsPlaying(false);
              if (activeSession) {
                completeSessionMutation.mutate(activeSession.id);
              }
            }}
            className="w-full h-full"
            style={{ paddingBottom: '180px' }}
            autoplay={false}
          />
        </div>
        
        {/* Workout Info Panel - Bottom overlay with pointer-events-none for video controls */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none"
          style={{ height: '180px' }}
        >
          <div className="p-6 pointer-events-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1 text-white">{workout.title}</h2>
                <p className="text-slate-300">{workout.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs text-slate-400">Duration</p>
                <p className="font-semibold text-white text-sm">{Math.floor(workout.duration / 60)} min</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <Flame className="h-4 w-4 text-accent" />
                </div>
                <p className="text-xs text-slate-400">Calories</p>
                <p className="font-semibold text-white text-sm">{workout.calories || 'N/A'}</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <Target className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-xs text-slate-400">Level</p>
                <p className="font-semibold text-white text-sm capitalize">{workout.difficulty}</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <span className="text-blue-500 text-xs font-bold">P90X3</span>
                </div>
                <p className="text-xs text-slate-400">Program</p>
                <p className="font-semibold text-white text-sm">Day {workout.dayNumber || 1}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}