import {
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
  type UserChallenge,
  type InsertUserChallenge,
} from "@shared/schema";
import { supabase } from "./db";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Workout operations
  getAllWorkouts(): Promise<Workout[]>;
  getWorkout(id: string): Promise<Workout | undefined>;
  getWorkoutByDay(dayNumber: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: string, workout: Partial<InsertWorkout>): Promise<Workout>;
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
  
  // Challenge operations
  startUserChallenge(userId: string): Promise<UserChallenge>;
  getUserChallenge(userId: string): Promise<UserChallenge | undefined>;
  updateChallengeProgress(userId: string, dayNumber: number): Promise<UserChallenge>;
  getTodaysWorkout(userId: string): Promise<Workout | undefined>;
  
  // Utility operations
  updateWorkoutTitles(): Promise<void>;
  seedInitialData(): Promise<void>;
  addVimeoWorkout(workoutData: any): Promise<Workout>;
  getWorkoutGroups(): Promise<{ title: string; count: number; days: number[] }[]>;
  bulkUpdateWorkoutsByName(workoutName: string, vimeoUrl: string): Promise<{ updatedCount: number }>;
  getCompletedWorkouts(userId: string): Promise<string[]>;
  migrateWorkoutsFromNeon(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    
    // Convert snake_case to camelCase for TypeScript
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      profileImageUrl: data.profile_image_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as User;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Convert camelCase to snake_case for database
    const dbUserData = {
      id: userData.id,
      email: userData.email,
      first_name: userData.firstName || null,
      last_name: userData.lastName || null,
      profile_image_url: userData.profileImageUrl || null,
      created_at: userData.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(dbUserData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Convert snake_case back to camelCase for TypeScript
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      profileImageUrl: data.profile_image_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as User;
  }
  
  // Workout operations
  async getAllWorkouts(): Promise<Workout[]> {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('day_number');
    
    if (error) {
      console.error('Error fetching workouts:', error);
      throw error;
    }
    
    if (!data) return [];
    
    // Convert snake_case to camelCase for TypeScript
    return data.map(workout => ({
      id: workout.id,
      title: workout.title,
      description: workout.description,
      videoUrl: workout.video_url,
      vimeoId: workout.vimeo_id,
      thumbnailUrl: workout.thumbnail_url,
      duration: workout.duration,
      difficulty: workout.difficulty,
      calories: workout.calories,
      equipment: workout.equipment,
      instructor: workout.instructor,
      rating: workout.rating,
      dayNumber: workout.day_number,
      weekNumber: workout.week_number,
      createdAt: workout.created_at,
    })) as Workout[];
  }
  
  async getWorkout(id: string): Promise<Workout | undefined> {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    
    // Convert snake_case to camelCase for TypeScript
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      videoUrl: data.video_url,
      vimeoId: data.vimeo_id,
      thumbnailUrl: data.thumbnail_url,
      duration: data.duration,
      difficulty: data.difficulty,
      calories: data.calories,
      equipment: data.equipment,
      instructor: data.instructor,
      rating: data.rating,
      dayNumber: data.day_number,
      weekNumber: data.week_number,
      createdAt: data.created_at,
    } as Workout;
  }
  
  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const { data, error } = await supabase
      .from('workouts')
      .insert(workout)
      .select()
      .single();
    
    if (error) throw error;
    return data as Workout;
  }
  
  async getWorkoutByDay(dayNumber: number): Promise<Workout | undefined> {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('day_number', dayNumber)
      .single();
    
    if (error || !data) return undefined;
    
    // Convert snake_case to camelCase for TypeScript
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      videoUrl: data.video_url,
      vimeoId: data.vimeo_id,
      thumbnailUrl: data.thumbnail_url,
      duration: data.duration,
      difficulty: data.difficulty,
      calories: data.calories,
      equipment: data.equipment,
      instructor: data.instructor,
      rating: data.rating,
      dayNumber: data.day_number,
      weekNumber: data.week_number,
      createdAt: data.created_at,
    } as Workout;
  }
  
  async updateWorkout(id: string, workoutData: Partial<InsertWorkout>): Promise<Workout> {
    const { data, error } = await supabase
      .from('workouts')
      .update(workoutData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Workout;
  }
  
  async getFeaturedWorkouts(): Promise<Workout[]> {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('rating', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching featured workouts:', error);
      throw error;
    }
    
    if (!data) return [];
    
    // Convert snake_case to camelCase for TypeScript
    return data.map(workout => ({
      id: workout.id,
      title: workout.title,
      description: workout.description,
      videoUrl: workout.video_url,
      vimeoId: workout.vimeo_id,
      thumbnailUrl: workout.thumbnail_url,
      duration: workout.duration,
      difficulty: workout.difficulty,
      calories: workout.calories,
      equipment: workout.equipment,
      instructor: workout.instructor,
      rating: workout.rating,
      dayNumber: workout.day_number,
      weekNumber: workout.week_number,
      createdAt: workout.created_at,
    })) as Workout[];
  }
  
  // Exercise operations
  async getAllExercises(): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*');
    
    if (error) throw error;
    return data as Exercise[];
  }
  
  async getExercise(id: string): Promise<Exercise | undefined> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Exercise;
  }
  
  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const { data, error } = await supabase
      .from('exercises')
      .insert(exercise)
      .select()
      .single();
    
    if (error) throw error;
    return data as Exercise;
  }
  
  async getWorkoutExercises(workoutId: string): Promise<(WorkoutExercise & { exercise: Exercise })[]> {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercises(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index');
    
    if (error) throw error;
    return data.map((row: any) => ({
      ...row,
      exercise: row.exercise,
    })) as (WorkoutExercise & { exercise: Exercise })[];
  }
  
  // User workout session operations
  async createWorkoutSession(session: InsertUserWorkoutSession): Promise<UserWorkoutSession> {
    const { data, error } = await supabase
      .from('user_workout_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    return data as UserWorkoutSession;
  }
  
  async getActiveUserSession(userId: string): Promise<UserWorkoutSession | undefined> {
    const { data, error } = await supabase
      .from('user_workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('completed_at', null)
      .single();
    
    if (error || !data) return undefined;
    return data as UserWorkoutSession;
  }
  
  async completeWorkoutSession(sessionId: string, duration: number, caloriesBurned: number): Promise<UserWorkoutSession> {
    const { data, error } = await supabase
      .from('user_workout_sessions')
      .update({
        completed_at: new Date().toISOString(),
        duration,
        calories_burned: caloriesBurned,
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    return data as UserWorkoutSession;
  }
  
  async getUserWorkoutSessions(userId: string): Promise<UserWorkoutSession[]> {
    const { data, error } = await supabase
      .from('user_workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });
    
    if (error) throw error;
    return data as UserWorkoutSession[];
  }

  async getCompletedWorkouts(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_workout_sessions')
      .select('workout_id')
      .eq('user_id', userId)
      .not('completed_at', 'is', null);
    
    if (error) throw error;
    return data.map((session: any) => session.workout_id).filter((id: string) => id !== null);
  }
  
  // Exercise set operations
  async createExerciseSet(set: InsertExerciseSet): Promise<ExerciseSet> {
    const { data, error } = await supabase
      .from('exercise_sets')
      .insert(set)
      .select()
      .single();
    
    if (error) throw error;
    return data as ExerciseSet;
  }
  
  async updateExerciseSet(id: string, set: Partial<InsertExerciseSet>): Promise<ExerciseSet> {
    const { data, error } = await supabase
      .from('exercise_sets')
      .update(set)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as ExerciseSet;
  }
  
  async getSessionExerciseSets(sessionId: string): Promise<ExerciseSet[]> {
    const { data, error } = await supabase
      .from('exercise_sets')
      .select('*')
      .eq('session_id', sessionId)
      .order('set_number');
    
    if (error) throw error;
    return data as ExerciseSet[];
  }
  
  // User progress operations
  async getUserProgress(userId: string): Promise<UserProgress | undefined> {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) return undefined;
    return data as UserProgress;
  }
  
  async updateUserProgress(userId: string, progressData: InsertUserProgress): Promise<UserProgress> {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({ ...progressData, user_id: userId }, { onConflict: 'user_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data as UserProgress;
  }
  
  // Favorite workouts operations
  async addFavoriteWorkout(userId: string, workoutId: string): Promise<FavoriteWorkout> {
    const { data, error } = await supabase
      .from('favorite_workouts')
      .insert({ user_id: userId, workout_id: workoutId })
      .select()
      .single();
    
    if (error) throw error;
    return data as FavoriteWorkout;
  }
  
  async removeFavoriteWorkout(userId: string, workoutId: string): Promise<void> {
    const { error } = await supabase
      .from('favorite_workouts')
      .delete()
      .eq('user_id', userId)
      .eq('workout_id', workoutId);
    
    if (error) throw error;
  }
  
  async getUserFavoriteWorkouts(userId: string): Promise<Workout[]> {
    const { data, error } = await supabase
      .from('favorite_workouts')
      .select(`
        workouts(*)
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data.map((row: any) => row.workouts) as Workout[];
  }
  
  async isWorkoutFavorited(userId: string, workoutId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('favorite_workouts')
      .select('id')
      .eq('user_id', userId)
      .eq('workout_id', workoutId)
      .single();
    
    return !error && !!data;
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

  // Add or update a Vimeo workout
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
      title: workoutData.title,
      description: workoutData.description,
      videoUrl: workoutData.vimeoUrl,
      video_url: workoutData.vimeoUrl,
      vimeoId: vimeoId,
      vimeo_id: vimeoId,
      thumbnailUrl: `https://vumbnail.com/${vimeoId}.jpg`,
      thumbnail_url: `https://vumbnail.com/${vimeoId}.jpg`, // Vimeo thumbnail service
      duration: 1800, // 30 minutes default
      calories: 200,
      rating: "4.5",
      difficulty: workoutData.difficulty || "intermediate",
      instructor: workoutData.instructor || "Instructor",
      equipment: workoutData.equipment || "Bodyweight",
      dayNumber: workoutData.dayNumber,
      day_number: workoutData.dayNumber,
      weekNumber: workoutData.weekNumber,
      week_number: workoutData.weekNumber,
    };
    
    // Check if workout already exists for this day
    if (workoutData.dayNumber) {
      const existingWorkout = await this.getWorkoutByDay(workoutData.dayNumber);
      
      if (existingWorkout) {
        // Update existing workout
        return await this.updateWorkout(existingWorkout.id, workout);
      }
    }
    
    // Create new workout if none exists for this day
    return await this.createWorkout(workout);
  }

  // Update workout titles to match P90X3 calendar
  async updateWorkoutTitles(): Promise<void> {
    // P90X3 workout schedule from calendar screenshot
    const p90x3Schedule = [
      // BLOCK 1 - Weeks 1-4
      // Week 1
      "Total Synergistics", "Agility X", "X3 Yoga", "The Challenge", "CVX", "The Warrior", "Dynamix",
      // Week 2  
      "Total Synergistics", "Agility X", "X3 Yoga", "The Challenge", "CVX", "The Warrior", "Dynamix",
      // Week 3
      "Total Synergistics", "Agility X", "X3 Yoga", "The Challenge", "CVX", "The Warrior", "Dynamix", 
      // Week 4
      "Isometrix", "Dynamics", "Accelerator", "Pilates X", "CVX", "X3 Yoga", "Dynamix",
      
      // BLOCK 2 - Weeks 5-8  
      // Week 5
      "Eccentric Upper", "Triometrics", "X3 Yoga", "Eccentric Lower", "Incinerator", "MMX", "Dynamix",
      // Week 6
      "Eccentric Upper", "Triometrics", "X3 Yoga", "Eccentric Lower", "Incinerator", "MMX", "Dynamix",
      // Week 7
      "Eccentric Upper", "Triometrics", "X3 Yoga", "Eccentric Lower", "Incinerator", "MMX", "Dynamix",
      // Week 8
      "Isometrix", "Dynamix", "Accelerator", "Pilates X", "CVX", "X3 Yoga", "Dynamix",
      
      // BLOCK 3 - Weeks 9-13
      // Week 9
      "Decelerator", "Agility X", "The Challenge", "X3 Yoga", "Triometrics", "Total Synergistics", "Dynamix",
      // Week 10
      "Decelerator", "MMX", "Eccentric Upper", "Triometrics", "Pilates X", "Eccentric Lower", "Dynamix",
      // Week 11
      "Decelerator", "Agility X", "The Challenge", "X3 Yoga", "Triometrics", "Total Synergistics", "Dynamix", 
      // Week 12
      "Decelerator", "MMX", "Eccentric Upper", "Triometrics", "Pilates X", "Eccentric Lower", "Dynamix",
      // Week 13 (5 days only)
      "Isometrix", "Accelerator", "Pilates X", "X3 Yoga", "Dynamix"
    ];

    // Update each workout with the correct P90X3 title
    for (let day = 1; day <= 90; day++) {
      const workoutTitle = p90x3Schedule[day - 1];
      if (workoutTitle) {
        const existingWorkout = await this.getWorkoutByDay(day);
        if (existingWorkout) {
          await this.updateWorkout(existingWorkout.id, {
            title: workoutTitle,
            description: `P90X3 ${workoutTitle} - 30-minute workout for day ${day}`
          });
          console.log(`Updated Day ${day}: ${workoutTitle}`);
        }
      }
    }
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
        video_url: `https://vimeo.com/${vimeoId}`,
        vimeoId: vimeoId,
        vimeo_id: vimeoId,
        thumbnailUrl: `https://vumbnail.com/${vimeoId}.jpg`,
        thumbnail_url: `https://vumbnail.com/${vimeoId}.jpg`,
        duration: 1800, // 30 minutes
        difficulty: day <= 30 ? "beginner" : day <= 60 ? "intermediate" : "advanced",
        calories: 200 + Math.floor(day / 10) * 20,
        equipment: day % 3 === 0 ? "Dumbbells" : day % 2 === 0 ? "Bodyweight" : "Resistance Bands",
        instructor: instructors[typeIndex],
        rating: "4.5",
        dayNumber: day,
        day_number: day,
        weekNumber: week,
        week_number: week
      };
      
      await this.createWorkout(workout);
    }
  }

  async getWorkoutGroups(): Promise<{ title: string; count: number; days: number[] }[]> {
    const { data, error } = await supabase
      .from('workouts')
      .select('title, day_number')
      .not('title', 'is', null)
      .not('day_number', 'is', null)
      .order('day_number');

    if (error) throw error;

    // Group by title and collect day numbers
    const groupMap = new Map<string, number[]>();
    for (const result of data) {
      if (!groupMap.has(result.title)) {
        groupMap.set(result.title, []);
      }
      groupMap.get(result.title)!.push(result.day_number!);
    }

    // Convert to the expected format
    return Array.from(groupMap.entries())
      .map(([title, days]) => ({
        title,
        count: days.length,
        days: days.sort((a, b) => a - b),
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  async bulkUpdateWorkoutsByName(workoutName: string, vimeoUrl: string): Promise<{ updatedCount: number }> {
    // Extract Vimeo ID from URL or use directly if it's already an ID
    let vimeoId = vimeoUrl;
    const vimeoUrlMatch = vimeoUrl.match(/(?:vimeo\.com\/(?:video\/)?)(\d+)/);
    if (vimeoUrlMatch) {
      vimeoId = vimeoUrlMatch[1];
    }

    // Update all workouts with the specified name
    const { data, error } = await supabase
      .from('workouts')
      .update({
        vimeo_id: vimeoId,
        thumbnail_url: `https://vumbnail.com/${vimeoId}.jpg`,
      })
      .eq('title', workoutName)
      .select('id');

    if (error) throw error;
    return { updatedCount: data.length };
  }

  // Challenge operations
  async startUserChallenge(userId: string): Promise<UserChallenge> {
    // Check if user already has an active challenge
    const existingChallenge = await this.getUserChallenge(userId);
    if (existingChallenge && existingChallenge.isActive) {
      return existingChallenge;
    }

    // Create new challenge
    const { data, error } = await supabase
      .from('user_challenges')
      .insert({
        user_id: userId,
        start_date: new Date().toISOString(),
        current_day: 1,
        is_active: true,
        completed_days: [],
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as UserChallenge;
  }

  async getUserChallenge(userId: string): Promise<UserChallenge | undefined> {
    const { data, error } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .single();
    
    if (error || !data) return undefined;
    return data as UserChallenge;
  }

  async updateChallengeProgress(userId: string, dayNumber: number): Promise<UserChallenge> {
    const challenge = await this.getUserChallenge(userId);
    if (!challenge) {
      throw new Error("No active challenge found for user");
    }

    // Add day to completed days if not already completed
    const completedDays = challenge.completedDays || [];
    const updatedCompletedDays = completedDays.includes(dayNumber) 
      ? completedDays 
      : [...completedDays, dayNumber].sort((a, b) => a - b);

    // Calculate current day based on start date
    const daysSinceStart = Math.floor((Date.now() - new Date(challenge.startDate).getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const newCurrentDay = Math.min(daysSinceStart, 90);

    // Check if challenge is completed
    const isCompleted = updatedCompletedDays.length >= 90 || newCurrentDay > 90;

    const { data, error } = await supabase
      .from('user_challenges')
      .update({
        current_day: newCurrentDay,
        completed_days: updatedCompletedDays,
        is_active: !isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', challenge.id)
      .select()
      .single();

    if (error) throw error;
    return data as UserChallenge;
  }

  async getTodaysWorkout(userId: string): Promise<Workout | undefined> {
    const challenge = await this.getUserChallenge(userId);
    if (!challenge) {
      console.log('No active challenge found for user:', userId);
      return undefined;
    }

    // Calculate current day based on start date
    const daysSinceStart = Math.floor((Date.now() - new Date(challenge.startDate).getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const currentDay = Math.min(daysSinceStart, 90);
    
    console.log('Challenge found:', { challengeId: challenge.id, currentDay, daysSinceStart });

    // Get workout for current day
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('day_number', currentDay)
      .single();

    if (error) {
      console.log('Error fetching today\'s workout:', error);
      return undefined;
    }
    
    if (!data) {
      console.log('No workout found for day:', currentDay);
      return undefined;
    }

    console.log('Found today\'s workout:', { title: data.title, dayNumber: data.day_number });
    
    // Convert snake_case to camelCase for TypeScript
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      videoUrl: data.video_url,
      vimeoId: data.vimeo_id,
      thumbnailUrl: data.thumbnail_url,
      duration: data.duration,
      difficulty: data.difficulty,
      calories: data.calories,
      equipment: data.equipment,
      instructor: data.instructor,
      rating: data.rating,
      dayNumber: data.day_number,
      weekNumber: data.week_number,
      createdAt: data.created_at,
    } as Workout;
  }

  // Migration method to transfer workouts from Neon to Supabase
  async migrateWorkoutsFromNeon(): Promise<void> {
    console.log('Starting migration from Neon to Supabase...');
    
    // Connect to Neon database using existing postgres package
    const postgres = await import('postgres');
    const sql = postgres.default(process.env.DATABASE_URL!);
    
    try {
      // Get all workouts from Neon
      const neonWorkouts = await sql`SELECT * FROM workouts ORDER BY day_number`;
      
      console.log(`Found ${neonWorkouts.length} workouts in Neon database`);
      
      // Clear existing workouts in Supabase
      const { error: deleteError } = await supabase
        .from('workouts')
        .delete()
        .neq('id', 'impossible-id'); // Delete all
      
      if (deleteError) {
        console.error('Error clearing Supabase workouts:', deleteError);
      }
      
      // Insert workouts into Supabase
      const supabaseWorkouts = neonWorkouts.map(workout => ({
        id: workout.id,
        title: workout.title,
        description: workout.description,
        video_url: workout.video_url,
        vimeo_id: workout.vimeo_id,
        thumbnail_url: workout.thumbnail_url,
        duration: workout.duration,
        difficulty: workout.difficulty,
        calories: workout.calories,
        equipment: workout.equipment,
        instructor: workout.instructor,
        rating: workout.rating,
        day_number: workout.day_number,
        week_number: workout.week_number,
        created_at: workout.created_at,
      }));
      
      // Insert in batches to avoid size limits
      const batchSize = 100;
      for (let i = 0; i < supabaseWorkouts.length; i += batchSize) {
        const batch = supabaseWorkouts.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('workouts')
          .insert(batch);
        
        if (insertError) {
          console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
          throw insertError;
        }
        
        console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(supabaseWorkouts.length / batchSize)}`);
      }
      
      console.log(`Successfully migrated ${supabaseWorkouts.length} workouts to Supabase`);
      
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    } finally {
      await sql.end();
    }
  }

  // Stub methods for interface compliance
  async updateWorkoutTitles(): Promise<void> {
    console.log('updateWorkoutTitles - not implemented');
  }

  async seedInitialData(): Promise<void> {
    console.log('seedInitialData - not implemented');
  }

  async addVimeoWorkout(workoutData: any): Promise<Workout> {
    throw new Error("addVimeoWorkout - not implemented yet");
  }

  async getWorkoutGroups(): Promise<{ title: string; count: number; days: number[] }[]> {
    return [];
  }

  async bulkUpdateWorkoutsByName(workoutName: string, vimeoUrl: string): Promise<{ updatedCount: number }> {
    return { updatedCount: 0 };
  }

  async getCompletedWorkouts(userId: string): Promise<string[]> {
    return [];
  }
}

export const storage = new DatabaseStorage();