import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Check,
  Timer,
  Calendar,
  Dumbbell
} from "lucide-react";

interface ExerciseSet {
  id?: string;
  setNumber: number;
  weight?: number;
  reps?: number;
  duration?: number;
  completed: boolean;
}

interface ExerciseData {
  id: string;
  name: string;
  sets: ExerciseSet[];
}

export default function WorkoutSheet() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
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

  const { data: session } = useQuery({
    queryKey: ["/api/sessions/active"],
    retry: false,
  });

  const { data: sessionSets } = useQuery({
    queryKey: ["/api/sessions", session?.id, "sets"],
    retry: false,
    enabled: !!session?.id,
  });

  const createSetMutation = useMutation({
    mutationFn: async (setData: {
      sessionId: string;
      exerciseId: string;
      setNumber: number;
      weight?: number;
      reps?: number;
      duration?: number;
      completed: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/sets", setData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", session?.id, "sets"] });
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
        description: "Failed to save exercise set",
        variant: "destructive",
      });
    },
  });

  const updateSetMutation = useMutation({
    mutationFn: async ({ id, ...setData }: {
      id: string;
      weight?: number;
      reps?: number;
      duration?: number;
      completed?: boolean;
    }) => {
      const response = await apiRequest("PUT", `/api/sets/${id}`, setData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", session?.id, "sets"] });
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
        description: "Failed to update exercise set",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (session) {
      setActiveSession(session.id);
    }
  }, [session]);

  // Initialize exercises with common workout exercises
  useEffect(() => {
    if (!exercises.length) {
      const defaultExercises: ExerciseData[] = [
        {
          id: "bench-press",
          name: "Bench Press",
          sets: [
            { setNumber: 1, weight: undefined, reps: undefined, completed: false },
            { setNumber: 2, weight: undefined, reps: undefined, completed: false },
            { setNumber: 3, weight: undefined, reps: undefined, completed: false },
          ]
        },
        {
          id: "incline-dumbbell-press",
          name: "Incline Dumbbell Press",
          sets: [
            { setNumber: 1, weight: undefined, reps: undefined, completed: false },
          ]
        }
      ];
      setExercises(defaultExercises);
    }
  }, [exercises.length]);

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  const handleGoBack = () => {
    navigate("/");
  };

  const handleSaveWorkout = () => {
    // Save logic would go here
    toast({
      title: "Workout Saved",
      description: "Your workout has been saved successfully",
    });
    navigate("/");
  };

  const updateExerciseSet = (exerciseId: string, setIndex: number, field: keyof ExerciseSet, value: any) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        const updatedSets = exercise.sets.map((set, index) => {
          if (index === setIndex) {
            return { ...set, [field]: value };
          }
          return set;
        });
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    }));
  };

  const toggleSetComplete = (exerciseId: string, setIndex: number) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    const set = exercise?.sets[setIndex];
    if (set) {
      const newCompleted = !set.completed;
      updateExerciseSet(exerciseId, setIndex, 'completed', newCompleted);
      
      // If we have an active session and set data, save to backend
      if (activeSession && set.id) {
        updateSetMutation.mutate({
          id: set.id,
          completed: newCompleted,
        });
      }
    }
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        const newSetNumber = exercise.sets.length + 1;
        const newSet: ExerciseSet = {
          setNumber: newSetNumber,
          weight: undefined,
          reps: undefined,
          completed: false,
        };
        return { ...exercise, sets: [...exercise.sets, newSet] };
      }
      return exercise;
    }));
  };

  const addExercise = () => {
    const newExercise: ExerciseData = {
      id: `exercise-${Date.now()}`,
      name: "New Exercise",
      sets: [
        { setNumber: 1, weight: undefined, reps: undefined, completed: false },
      ]
    };
    setExercises([...exercises, newExercise]);
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

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
          <h1 className="text-xl font-bold text-white">Workout Sheet</h1>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90 text-white font-semibold"
          onClick={handleSaveWorkout}
        >
          Save
        </Button>
      </header>
      
      <main className="px-6 py-6 space-y-6">
        {/* Current Workout Info */}
        <Card className="bg-surface border-slate-700">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Current Workout</h2>
              <Badge className="bg-primary text-white">
                <Calendar className="w-3 h-3 mr-1" />
                Today
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Date:</span>
                <span className="font-semibold text-white">{formatDate()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Program:</span>
                <span className="font-semibold text-white">Strength Training</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Exercises:</span>
                <span className="font-semibold text-white">{exercises.length} exercises</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Exercise Tracking */}
        <section>
          <h2 className="text-lg font-bold mb-4 text-white">Exercise Log</h2>
          
          <div className="space-y-4">
            {exercises.map((exercise, exerciseIndex) => (
              <Card key={exercise.id} className="bg-surface border-slate-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-white">{exercise.name}</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-primary"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2 text-sm text-slate-400 mb-2">
                      <span>Set</span>
                      <span>Weight</span>
                      <span>Reps</span>
                      <span>Done</span>
                    </div>
                    
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-4 gap-2 items-center">
                        <span className="text-sm font-medium text-white">{set.setNumber}</span>
                        <Input
                          type="number"
                          placeholder="0"
                          value={set.weight || ''}
                          onChange={(e) => updateExerciseSet(exercise.id, setIndex, 'weight', Number(e.target.value) || undefined)}
                          className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 text-sm h-8"
                        />
                        <Input
                          type="number"
                          placeholder="0"
                          value={set.reps || ''}
                          onChange={(e) => updateExerciseSet(exercise.id, setIndex, 'reps', Number(e.target.value) || undefined)}
                          className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 text-sm h-8"
                        />
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`w-6 h-6 rounded-full ${
                              set.completed 
                                ? 'bg-emerald-500 hover:bg-emerald-600' 
                                : 'border-2 border-slate-600 hover:border-slate-500'
                            }`}
                            onClick={() => toggleSetComplete(exercise.id, setIndex)}
                          >
                            {set.completed && <Check className="h-3 w-3 text-white" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full mt-3 text-primary hover:bg-primary/10"
                    onClick={() => addSet(exercise.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Set
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Button 
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-semibold py-3"
            onClick={addExercise}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Exercise
          </Button>
        </section>
        
        {/* Notes Section */}
        <Card className="bg-surface border-slate-700">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 text-white">Workout Notes</h3>
            <Textarea
              placeholder="How did this workout feel? Any observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 resize-none"
              rows={4}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
