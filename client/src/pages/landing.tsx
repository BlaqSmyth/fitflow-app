import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Play, BarChart3, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-orange-500 to-accent relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-16 h-16 border-2 border-white rounded-full"></div>
        <div className="absolute top-40 right-16 w-8 h-8 bg-white rounded-full"></div>
        <div className="absolute bottom-32 left-6 w-12 h-12 border-2 border-white transform rotate-45"></div>
        <div className="absolute bottom-20 right-8 w-6 h-6 bg-white transform rotate-45"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 text-center">
          <div className="mb-8">
            <Dumbbell className="w-16 h-16 text-white mx-auto mb-4" />
            <h1 className="text-5xl font-bold text-white mb-2">FitFlow</h1>
            <p className="text-xl font-medium text-white/90">
              Transform Your Body, Transform Your Life
            </p>
          </div>
          
          <div className="space-y-4 max-w-sm mx-auto">
            <p className="text-lg text-white/80">
              90+ Premium Workouts • 4 Training Programs • Track Your Progress
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-surface/95 backdrop-blur-lg p-6 rounded-t-3xl -mt-8">
          <div className="max-w-sm mx-auto space-y-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <Play className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-white">90+ Videos</p>
              </div>
              <div className="text-center">
                <BarChart3 className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Track Progress</p>
              </div>
              <div className="text-center">
                <Dumbbell className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">4 Programs</p>
              </div>
              <div className="text-center">
                <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Expert Trainers</p>
              </div>
            </div>

            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-primary/25"
              onClick={() => window.location.href = '/api/login'}
            >
              Get Started
            </Button>
            
            <div className="text-center">
              <p className="text-slate-400 text-sm">
                By continuing, you agree to our Terms & Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
