import {
  users,
  workouts,
  exercises,
  workoutExercises,
  userWorkoutSessions,
  exerciseSets,
  userProgress,
  favoriteWorkouts,
  type User,
  type UpsertUser,
  type Workout,
  type InsertWorkout,
  type Exercise,
  type InsertExercise,
  type WorkoutExercise,
  type InsertWorkoutExercise,
  type UserWorkoutSession,
  type InsertUserWorkoutSession,
  type ExerciseSet,
  type InsertExerciseSet,
  type UserProgress,
  type InsertUserProgress,
  type FavoriteWorkout,
  type InsertFavoriteWorkout,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Workout operations
  getAllWorkouts(): Promise<Workout[]>;
  getWorkout(id: string): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  getFeaturedWorkouts(): Promise<Workout[]>;
  
  // Exercise operations
  getAllExercises(): Promise<Exercise[]>;
  getExercise(id: string): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  getWorkoutExercises(workoutId: string): Promise<(WorkoutExercise & { exercise: Exercise })[]>;
  
  // User workout session operations
  createWorkoutSession(session: InsertUserWorkoutSession): Promise<UserWorkoutSession>;
  getActiveUserSession(userId: string): Promise<UserWorkoutSession | undefined>;
  completeWorkoutSession(sessionId: string, duration: number, caloriesBurned: number): Promise<UserWorkoutSession>;
  getUserWorkoutSessions(userId: string): Promise<UserWorkoutSession[]>;
  
  // Exercise set operations
  createExerciseSet(set: InsertExerciseSet): Promise<ExerciseSet>;
  updateExerciseSet(id: string, set: Partial<InsertExerciseSet>): Promise<ExerciseSet>;
  getSessionExerciseSets(sessionId: string): Promise<ExerciseSet[]>;
  
  // User progress operations
  getUserProgress(userId: string): Promise<UserProgress | undefined>;
  updateUserProgress(userId: string, progress: InsertUserProgress): Promise<UserProgress>;
  
  // Favorite workouts operations
  addFavoriteWorkout(userId: string, workoutId: string): Promise<FavoriteWorkout>;
  removeFavoriteWorkout(userId: string, workoutId: string): Promise<void>;
  getUserFavoriteWorkouts(userId: string): Promise<Workout[]>;
  isWorkoutFavorited(userId: string, workoutId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Workout operations
  async getAllWorkouts(): Promise<Workout[]> {
    return await db.select().from(workouts).orderBy(desc(workouts.createdAt));
  }
  
  async getWorkout(id: string): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout;
  }
  
  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }
  
  async getFeaturedWorkouts(): Promise<Workout[]> {
    return await db.select().from(workouts)
      .orderBy(desc(workouts.rating))
      .limit(10);
  }
  
  // Exercise operations
  async getAllExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises);
  }
  
  async getExercise(id: string): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise;
  }
  
  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [newExercise] = await db.insert(exercises).values(exercise).returning();
    return newExercise;
  }
  
  async getWorkoutExercises(workoutId: string): Promise<(WorkoutExercise & { exercise: Exercise })[]> {
    const result = await db.select()
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.workoutId, workoutId))
      .orderBy(workoutExercises.orderIndex);
    
    return result.map(row => ({
      ...row.workout_exercises,
      exercise: row.exercises,
    }));
  }
  
  // User workout session operations
  async createWorkoutSession(session: InsertUserWorkoutSession): Promise<UserWorkoutSession> {
    const [newSession] = await db.insert(userWorkoutSessions).values(session).returning();
    return newSession;
  }
  
  async getActiveUserSession(userId: string): Promise<UserWorkoutSession | undefined> {
    const [session] = await db.select()
      .from(userWorkoutSessions)
      .where(and(
        eq(userWorkoutSessions.userId, userId),
        sql`${userWorkoutSessions.completedAt} IS NULL`
      ));
    return session;
  }
  
  async completeWorkoutSession(sessionId: string, duration: number, caloriesBurned: number): Promise<UserWorkoutSession> {
    const [session] = await db
      .update(userWorkoutSessions)
      .set({
        completedAt: new Date(),
        duration,
        caloriesBurned,
      })
      .where(eq(userWorkoutSessions.id, sessionId))
      .returning();
    return session;
  }
  
  async getUserWorkoutSessions(userId: string): Promise<UserWorkoutSession[]> {
    return await db.select()
      .from(userWorkoutSessions)
      .where(eq(userWorkoutSessions.userId, userId))
      .orderBy(desc(userWorkoutSessions.startedAt));
  }
  
  // Exercise set operations
  async createExerciseSet(set: InsertExerciseSet): Promise<ExerciseSet> {
    const [newSet] = await db.insert(exerciseSets).values(set).returning();
    return newSet;
  }
  
  async updateExerciseSet(id: string, set: Partial<InsertExerciseSet>): Promise<ExerciseSet> {
    const [updatedSet] = await db
      .update(exerciseSets)
      .set(set)
      .where(eq(exerciseSets.id, id))
      .returning();
    return updatedSet;
  }
  
  async getSessionExerciseSets(sessionId: string): Promise<ExerciseSet[]> {
    return await db.select()
      .from(exerciseSets)
      .where(eq(exerciseSets.sessionId, sessionId))
      .orderBy(exerciseSets.setNumber);
  }
  
  // User progress operations
  async getUserProgress(userId: string): Promise<UserProgress | undefined> {
    const [progress] = await db.select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .orderBy(desc(userProgress.date))
      .limit(1);
    return progress;
  }
  
  async updateUserProgress(userId: string, progressData: InsertUserProgress): Promise<UserProgress> {
    const [progress] = await db.insert(userProgress)
      .values({ ...progressData, userId })
      .onConflictDoUpdate({
        target: [userProgress.userId],
        set: progressData,
      })
      .returning();
    return progress;
  }
  
  // Favorite workouts operations
  async addFavoriteWorkout(userId: string, workoutId: string): Promise<FavoriteWorkout> {
    const [favorite] = await db.insert(favoriteWorkouts)
      .values({ userId, workoutId })
      .returning();
    return favorite;
  }
  
  async removeFavoriteWorkout(userId: string, workoutId: string): Promise<void> {
    await db.delete(favoriteWorkouts)
      .where(and(
        eq(favoriteWorkouts.userId, userId),
        eq(favoriteWorkouts.workoutId, workoutId)
      ));
  }
  
  async getUserFavoriteWorkouts(userId: string): Promise<Workout[]> {
    const result = await db.select()
      .from(favoriteWorkouts)
      .innerJoin(workouts, eq(favoriteWorkouts.workoutId, workouts.id))
      .where(eq(favoriteWorkouts.userId, userId));
    
    return result.map(row => row.workouts);
  }
  
  async isWorkoutFavorited(userId: string, workoutId: string): Promise<boolean> {
    const [favorite] = await db.select()
      .from(favoriteWorkouts)
      .where(and(
        eq(favoriteWorkouts.userId, userId),
        eq(favoriteWorkouts.workoutId, workoutId)
      ));
    return !!favorite;
  }

  // Helper function to extract Vimeo ID from URL
  private extractVimeoId(url: string): string {
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

  // Add a Vimeo workout
  async addVimeoWorkout(workoutData: {
    title: string;
    description?: string;
    vimeoUrl: string; // Full Vimeo URL or just the ID
    dayNumber?: number;
    weekNumber?: number;
    difficulty?: string;
    instructor?: string;
    equipment?: string;
  }): Promise<Workout> {
    const vimeoId = this.extractVimeoId(workoutData.vimeoUrl);
    
    const workout = {
      ...workoutData,
      videoUrl: workoutData.vimeoUrl,
      vimeoId: vimeoId,
      thumbnailUrl: `https://vumbnail.com/${vimeoId}.jpg`, // Vimeo thumbnail service
      duration: 1800, // 30 minutes default
      calories: 200,
      rating: "4.5",
      difficulty: workoutData.difficulty || "intermediate",
      instructor: workoutData.instructor || "Instructor",
      equipment: workoutData.equipment || "Bodyweight"
    };
    
    return await this.createWorkout(workout);
  }

  // Seed initial data for 90-day challenge
  async seedInitialData(): Promise<void> {
    // Sample Vimeo IDs for workouts
    const sampleVimeoIds = [
      "916076102", // Replace with your actual Vimeo video IDs
      "916076102", 
      "916076102",
      "916076102"
    ];
    
    // Workout types for variety
    const workoutTypes = ["Strength", "Cardio", "Flexibility", "HIIT"];
    const instructors = ["Sarah Johnson", "Mike Chen", "Lisa Rodriguez", "David Kim"];
    
    // Create 90 days of workouts (30 minutes each)
    for (let day = 1; day <= 90; day++) {
      const week = Math.ceil(day / 7);
      const typeIndex = (day - 1) % 4; // Rotate through workout types
      const workoutType = workoutTypes[typeIndex];
      const vimeoId = sampleVimeoIds[typeIndex];
      
      const workout = {
        title: `Day ${day}: ${workoutType} Challenge`,
        description: `30-minute ${workoutType.toLowerCase()} workout for day ${day} of your fitness journey`,
        videoUrl: `https://vimeo.com/${vimeoId}`,
        vimeoId: vimeoId,
        thumbnailUrl: `https://vumbnail.com/${vimeoId}.jpg`,
        duration: 1800, // 30 minutes
        difficulty: day <= 30 ? "beginner" : day <= 60 ? "intermediate" : "advanced",
        calories: 200 + Math.floor(day / 10) * 20,
        equipment: day % 3 === 0 ? "Dumbbells" : day % 2 === 0 ? "Bodyweight" : "Resistance Bands",
        instructor: instructors[typeIndex],
        rating: "4.5",
        dayNumber: day,
        weekNumber: week
      };
      
      await this.createWorkout(workout);
    }
  }
}

export const storage = new DatabaseStorage();
