import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Video } from "lucide-react";
import { Link } from "wouter";
interface VimeoWorkoutData {
  title: string;
  description: string;
  vimeoUrl: string;
  dayNumber: string;
  difficulty: string;
  instructor: string;
  equipment: string;
}

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [workoutData, setWorkoutData] = useState<VimeoWorkoutData>({
    title: "",
    description: "",
    vimeoUrl: "",
    dayNumber: "",
    difficulty: "intermediate",
    instructor: "",
    equipment: "Bodyweight"
  });

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


  const addWorkoutMutation = useMutation({
    mutationFn: async (data: VimeoWorkoutData) => {
      const response = await apiRequest("POST", "/api/workouts/vimeo", {
        ...data,
        dayNumber: data.dayNumber ? parseInt(data.dayNumber) : undefined,
        weekNumber: data.dayNumber ? Math.ceil(parseInt(data.dayNumber) / 7) : undefined
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vimeo workout added successfully!",
      });
      setWorkoutData({
        title: "",
        description: "",
        vimeoUrl: "",
        dayNumber: "",
        difficulty: "intermediate",
        instructor: "",
        equipment: "Bodyweight"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add workout. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutData.title || !workoutData.vimeoUrl) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    addWorkoutMutation.mutate(workoutData);
  };

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

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
          <h1 className="text-xl font-bold text-white">Add Vimeo Workouts</h1>
        </div>
        <Badge variant="secondary" className="bg-primary/20 text-primary">
          Admin Panel
        </Badge>
      </header>

      <main className="px-6 py-6 max-w-2xl mx-auto">
        <Card className="bg-surface border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add Vimeo Workout</h2>
                <p className="text-slate-400">Add your workout videos from Vimeo to the P90X3 challenge</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">Workout Title *</Label>
                  <Input
                    id="title"
                    value={workoutData.title}
                    onChange={(e) => setWorkoutData({...workoutData, title: e.target.value})}
                    placeholder="e.g., Day 1: Mass Challenge"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vimeoUrl" className="text-white">Vimeo URL or ID *</Label>
                  <Input
                    id="vimeoUrl"
                    value={workoutData.vimeoUrl}
                    onChange={(e) => setWorkoutData({...workoutData, vimeoUrl: e.target.value})}
                    placeholder="https://vimeo.com/123456789 or 123456789"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={workoutData.description}
                  onChange={(e) => setWorkoutData({...workoutData, description: e.target.value})}
                  placeholder="30-minute workout description..."
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dayNumber" className="text-white">Day Number (1-90)</Label>
                <Input
                  id="dayNumber"
                  type="number"
                  min="1"
                  max="90"
                  value={workoutData.dayNumber}
                  onChange={(e) => setWorkoutData({...workoutData, dayNumber: e.target.value})}
                  placeholder="1"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-white">Difficulty</Label>
                  <Select value={workoutData.difficulty} onValueChange={(value) => setWorkoutData({...workoutData, difficulty: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructor" className="text-white">Instructor</Label>
                  <Input
                    id="instructor"
                    value={workoutData.instructor}
                    onChange={(e) => setWorkoutData({...workoutData, instructor: e.target.value})}
                    placeholder="Instructor name"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipment" className="text-white">Equipment</Label>
                  <Select value={workoutData.equipment} onValueChange={(value) => setWorkoutData({...workoutData, equipment: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bodyweight">Bodyweight</SelectItem>
                      <SelectItem value="Dumbbells">Dumbbells</SelectItem>
                      <SelectItem value="Resistance Bands">Resistance Bands</SelectItem>
                      <SelectItem value="Pull-up Bar">Pull-up Bar</SelectItem>
                      <SelectItem value="Mixed">Mixed Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-accent text-white"
                  disabled={addWorkoutMutation.isPending}
                >
                  {addWorkoutMutation.isPending ? (
                    "Adding Workout..."
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Vimeo Workout
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h3 className="text-white font-semibold mb-2">📝 Vimeo Integration Guide</h3>
          <div className="text-slate-300 text-sm space-y-2">
            <p><strong>Vimeo URL formats supported:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>https://vimeo.com/123456789</li>
              <li>https://player.vimeo.com/video/123456789</li>
              <li>Just the video ID: 123456789</li>
            </ul>
            <p className="mt-3"><strong>Note:</strong> Videos will automatically be embedded with 30-minute duration and proper thumbnails from Vimeo.</p>
          </div>
        </div>
      </main>
    </div>
  );
}