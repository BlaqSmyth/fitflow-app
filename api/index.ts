// Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from "express";
import { setupAuth, isAuthenticated } from "../server/supabaseAuth";
import { storage } from "../server/storage";
import { insertWorkoutSchema, insertExerciseSetSchema, insertUserWorkoutSessionSchema } from "../shared/schema";

let app: express.Application | null = null;

async function getApp() {
  if (!app) {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    
    // Setup auth
    await setupAuth(app as any);
    
    // Register routes directly here for serverless
    app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.id;
        const user = await storage.getUser(userId);
        res.json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    });

    // Today's workout
    app.get('/api/workouts/today', isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.id;
        const todayWorkout = await storage.getTodaysWorkout(userId);
        res.json(todayWorkout);
      } catch (error) {
        console.error("Error fetching today's workout:", error);
        res.status(500).json({ message: "Failed to fetch today's workout" });
      }
    });

    // Featured workouts
    app.get('/api/workouts/featured', isAuthenticated, async (req, res) => {
      try {
        const workouts = await storage.getFeaturedWorkouts();
        res.json(workouts);
      } catch (error) {
        console.error("Error fetching featured workouts:", error);
        res.status(500).json({ message: "Failed to fetch featured workouts" });
      }
    });

    // All other essential routes
    app.get('/api/workouts', isAuthenticated, async (req, res) => {
      try {
        const workouts = await storage.getAllWorkouts();
        res.json(workouts);
      } catch (error) {
        console.error("Error fetching workouts:", error);
        res.status(500).json({ message: "Failed to fetch workouts" });
      }
    });
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  
  // Handle the request using express app
  return new Promise((resolve, reject) => {
    (app as any)(req, res, (err: any) => {
      if (err) reject(err);
      else resolve(undefined);
    });
  });
}