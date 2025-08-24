import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./supabaseAuth";
import { insertWorkoutSchema, insertExerciseSetSchema, insertUserWorkoutSessionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
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

  // Migration endpoint to transfer data from Neon to Supabase (no auth for migration)
  app.post('/api/migrate-workouts', async (req, res) => {
    try {
      console.log('Starting workout migration from Neon to Supabase...');
      await storage.migrateWorkoutsFromNeon();
      res.json({ success: true, message: 'Workouts migrated successfully' });
    } catch (error) {
      console.error("Migration error:", error);
      res.status(500).json({ message: "Failed to migrate workouts", error: error.message });
    }
  });

  // Workouts
  app.get('/api/workouts', isAuthenticated, async (req, res) => {
    try {
      console.log('Workouts API called by user:', (req as any).user?.id);
      const workouts = await storage.getAllWorkouts();
      console.log('Returning workouts:', workouts.length);
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

  // Get workout groups for bulk update
  app.get('/api/workouts/groups', isAuthenticated, async (req, res) => {
    try {
      const groups = await storage.getWorkoutGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching workout groups:", error);
      res.status(500).json({ message: "Failed to fetch workout groups" });
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
      const userId = req.user.id;
      const progress = await storage.getUserProgress(userId);
      res.json(progress || { totalWorkouts: 0, totalCalories: 0, workoutStreak: 0 });
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Challenge Management
  app.post('/api/challenge/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const challenge = await storage.startUserChallenge(userId);
      res.json(challenge);
    } catch (error) {
      console.error("Error starting challenge:", error);
      res.status(500).json({ message: "Failed to start challenge" });
    }
  });

  app.get('/api/challenge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const challenge = await storage.getUserChallenge(userId);
      res.json(challenge);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      res.status(500).json({ message: "Failed to fetch challenge" });
    }
  });

  app.get('/api/challenge/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const workout = await storage.getTodaysWorkout(userId);
      res.json(workout);
    } catch (error) {
      console.error("Error fetching today's workout:", error);
      res.status(500).json({ message: "Failed to fetch today's workout" });
    }
  });

  app.post('/api/challenge/complete/:dayNumber', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const dayNumber = parseInt(req.params.dayNumber);
      const challenge = await storage.updateChallengeProgress(userId, dayNumber);
      res.json(challenge);
    } catch (error) {
      console.error("Error updating challenge progress:", error);
      res.status(500).json({ message: "Failed to update challenge progress" });
    }
  });

  // Workout Sessions
  app.post('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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

  app.get('/api/sessions/completed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const completedWorkouts = await storage.getCompletedWorkouts(userId);
      res.json(completedWorkouts);
    } catch (error) {
      console.error("Error fetching completed workouts:", error);
      res.status(500).json({ message: "Failed to fetch completed workouts" });
    }
  });

  app.get('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
      await storage.removeFavoriteWorkout(userId, req.params.workoutId);
      res.json({ message: "Favorite removed" });
    } catch (error) {
      console.error("Error removing favorite workout:", error);
      res.status(500).json({ message: "Failed to remove favorite workout" });
    }
  });

  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const favorites = await storage.getUserFavoriteWorkouts(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorite workouts:", error);
      res.status(500).json({ message: "Failed to fetch favorite workouts" });
    }
  });

  app.get('/api/favorites/:workoutId/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const isFavorited = await storage.isWorkoutFavorited(userId, req.params.workoutId);
      res.json({ isFavorited });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  // Seed data endpoint (development only)
  app.post('/api/seed', async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: "Seeding only allowed in development" });
      }
      
      await storage.seedInitialData();
      res.json({ message: "Database seeded successfully with 90-day challenge data" });
    } catch (error) {
      console.error("Error seeding database:", error);
      res.status(500).json({ message: "Failed to seed database" });
    }
  });

  // Update workout titles endpoint (development only)
  app.post('/api/update-titles', async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: "Title updates only allowed in development" });
      }
      
      await storage.updateWorkoutTitles();
      res.json({ message: "Workout titles updated successfully with P90X3 schedule" });
    } catch (error) {
      console.error("Error updating workout titles:", error);
      res.status(500).json({ message: "Failed to update workout titles" });
    }
  });

  // Add Vimeo workout endpoint
  app.post('/api/workouts/vimeo', isAuthenticated, async (req, res) => {
    try {
      const workoutData = {
        ...req.body,
        // Ensure dayNumber and weekNumber are numbers, not strings
        dayNumber: req.body.dayNumber ? parseInt(req.body.dayNumber) : undefined,
        weekNumber: req.body.weekNumber ? parseInt(req.body.weekNumber) : undefined,
      };
      const workout = await storage.addVimeoWorkout(workoutData);
      res.json(workout);
    } catch (error) {
      console.error("Error adding Vimeo workout:", error);
      res.status(500).json({ message: "Failed to add Vimeo workout" });
    }
  });

  // Bulk update workouts by name
  app.post('/api/workouts/bulk-update', isAuthenticated, async (req, res) => {
    try {
      const { workoutName, vimeoUrl } = req.body;
      if (!workoutName || !vimeoUrl) {
        return res.status(400).json({ message: "workoutName and vimeoUrl are required" });
      }
      
      const result = await storage.bulkUpdateWorkoutsByName(workoutName, vimeoUrl);
      res.json(result);
    } catch (error) {
      console.error("Error bulk updating workouts:", error);
      res.status(500).json({ message: "Failed to bulk update workouts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
