import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertWorkoutSchema, insertExerciseSetSchema, insertUserWorkoutSessionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Workout Categories
  app.get('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getAllWorkoutCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Workouts
  app.get('/api/workouts', isAuthenticated, async (req, res) => {
    try {
      const { category } = req.query;
      let workouts;
      
      if (category) {
        workouts = await storage.getWorkoutsByCategory(category as string);
      } else {
        workouts = await storage.getAllWorkouts();
      }
      
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      res.status(500).json({ message: "Failed to fetch workouts" });
    }
  });

  app.get('/api/workouts/featured', isAuthenticated, async (req, res) => {
    try {
      const workouts = await storage.getFeaturedWorkouts();
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching featured workouts:", error);
      res.status(500).json({ message: "Failed to fetch featured workouts" });
    }
  });

  app.get('/api/workouts/:id', isAuthenticated, async (req, res) => {
    try {
      const workout = await storage.getWorkout(req.params.id);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      const exercises = await storage.getWorkoutExercises(workout.id);
      res.json({ ...workout, exercises });
    } catch (error) {
      console.error("Error fetching workout:", error);
      res.status(500).json({ message: "Failed to fetch workout" });
    }
  });

  // User Progress
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      res.json(progress || { totalWorkouts: 0, totalCalories: 0, workoutStreak: 0 });
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Workout Sessions
  app.post('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionData = insertUserWorkoutSessionSchema.parse({
        ...req.body,
        userId
      });
      
      const session = await storage.createWorkoutSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating workout session:", error);
      res.status(500).json({ message: "Failed to create workout session" });
    }
  });

  app.get('/api/sessions/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.getActiveUserSession(userId);
      res.json(session);
    } catch (error) {
      console.error("Error fetching active session:", error);
      res.status(500).json({ message: "Failed to fetch active session" });
    }
  });

  app.put('/api/sessions/:id/complete', isAuthenticated, async (req, res) => {
    try {
      const { duration, caloriesBurned } = req.body;
      const session = await storage.completeWorkoutSession(
        req.params.id,
        duration,
        caloriesBurned
      );
      res.json(session);
    } catch (error) {
      console.error("Error completing workout session:", error);
      res.status(500).json({ message: "Failed to complete workout session" });
    }
  });

  app.get('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserWorkoutSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching workout sessions:", error);
      res.status(500).json({ message: "Failed to fetch workout sessions" });
    }
  });

  // Exercise Sets
  app.post('/api/sets', isAuthenticated, async (req, res) => {
    try {
      const setData = insertExerciseSetSchema.parse(req.body);
      const set = await storage.createExerciseSet(setData);
      res.json(set);
    } catch (error) {
      console.error("Error creating exercise set:", error);
      res.status(500).json({ message: "Failed to create exercise set" });
    }
  });

  app.put('/api/sets/:id', isAuthenticated, async (req, res) => {
    try {
      const setData = insertExerciseSetSchema.partial().parse(req.body);
      const set = await storage.updateExerciseSet(req.params.id, setData);
      res.json(set);
    } catch (error) {
      console.error("Error updating exercise set:", error);
      res.status(500).json({ message: "Failed to update exercise set" });
    }
  });

  app.get('/api/sessions/:id/sets', isAuthenticated, async (req, res) => {
    try {
      const sets = await storage.getSessionExerciseSets(req.params.id);
      res.json(sets);
    } catch (error) {
      console.error("Error fetching exercise sets:", error);
      res.status(500).json({ message: "Failed to fetch exercise sets" });
    }
  });

  // Favorite Workouts
  app.post('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { workoutId } = req.body;
      const favorite = await storage.addFavoriteWorkout(userId, workoutId);
      res.json(favorite);
    } catch (error) {
      console.error("Error adding favorite workout:", error);
      res.status(500).json({ message: "Failed to add favorite workout" });
    }
  });

  app.delete('/api/favorites/:workoutId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removeFavoriteWorkout(userId, req.params.workoutId);
      res.json({ message: "Favorite removed" });
    } catch (error) {
      console.error("Error removing favorite workout:", error);
      res.status(500).json({ message: "Failed to remove favorite workout" });
    }
  });

  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getUserFavoriteWorkouts(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorite workouts:", error);
      res.status(500).json({ message: "Failed to fetch favorite workouts" });
    }
  });

  app.get('/api/favorites/:workoutId/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isFavorited = await storage.isWorkoutFavorited(userId, req.params.workoutId);
      res.json({ isFavorited });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
