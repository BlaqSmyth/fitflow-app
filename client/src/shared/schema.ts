import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workouts = pgTable("workouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  videoUrl: varchar("video_url").notNull(), // Full Vimeo URL or video ID
  vimeoId: varchar("vimeo_id"), // Extracted Vimeo video ID for embedding
  thumbnailUrl: varchar("thumbnail_url"),
  duration: integer("duration").notNull().default(1800), // 30 minutes in seconds
  difficulty: varchar("difficulty").notNull(), // beginner, intermediate, advanced
  calories: integer("calories").default(200),
  equipment: text("equipment"),
  instructor: varchar("instructor"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("4.5"),
  dayNumber: integer("day_number"), // Day 1-90 for challenge structure
  weekNumber: integer("week_number"), // Week 1-13 for organization  
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  muscleGroups: text("muscle_groups").array(),
  instructions: text("instructions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workoutId: varchar("workout_id").references(() => workouts.id),
  exerciseId: varchar("exercise_id").references(() => exercises.id),
  orderIndex: integer("order_index").notNull(),
  sets: integer("sets"),
  reps: integer("reps"),
  duration: integer("duration"), // in seconds
  restTime: integer("rest_time"), // in seconds
});

export const userWorkoutSessions = pgTable("user_workout_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  workoutId: varchar("workout_id").references(() => workouts.id),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // actual duration in seconds
  caloriesBurned: integer("calories_burned"),
  notes: text("notes"),
});

export const exerciseSets = pgTable("exercise_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => userWorkoutSessions.id),
  exerciseId: varchar("exercise_id").references(() => exercises.id),
  setNumber: integer("set_number").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  reps: integer("reps"),
  duration: integer("duration"), // in seconds for time-based exercises
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  date: timestamp("date").defaultNow(),
  totalWorkouts: integer("total_workouts").default(0),
  totalCalories: integer("total_calories").default(0),
  workoutStreak: integer("workout_streak").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// User 90-day challenge tracking
export const userChallenges = pgTable("user_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  currentDay: integer("current_day").notNull().default(1),
  isActive: boolean("is_active").default(true),
  completedDays: integer("completed_days").array().default(sql`ARRAY[]::integer[]`),
  pausedAt: timestamp("paused_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const favoriteWorkouts = pgTable("favorite_workouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  workoutId: varchar("workout_id").references(() => workouts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workoutSessions: many(userWorkoutSessions),
  progress: many(userProgress),
  favoriteWorkouts: many(favoriteWorkouts),
  challenges: many(userChallenges),
}));

export const workoutsRelations = relations(workouts, ({ many }) => ({
  workoutExercises: many(workoutExercises),
  userSessions: many(userWorkoutSessions),
  favorites: many(favoriteWorkouts),
}));

export const exercisesRelations = relations(exercises, ({ many }) => ({
  workoutExercises: many(workoutExercises),
  sets: many(exerciseSets),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one }) => ({
  workout: one(workouts, {
    fields: [workoutExercises.workoutId],
    references: [workouts.id],
  }),
  exercise: one(exercises, {
    fields: [workoutExercises.exerciseId],
    references: [exercises.id],
  }),
}));

export const userWorkoutSessionsRelations = relations(userWorkoutSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [userWorkoutSessions.userId],
    references: [users.id],
  }),
  workout: one(workouts, {
    fields: [userWorkoutSessions.workoutId],
    references: [workouts.id],
  }),
  exerciseSets: many(exerciseSets),
}));

export const exerciseSetsRelations = relations(exerciseSets, ({ one }) => ({
  session: one(userWorkoutSessions, {
    fields: [exerciseSets.sessionId],
    references: [userWorkoutSessions.id],
  }),
  exercise: one(exercises, {
    fields: [exerciseSets.exerciseId],
    references: [exercises.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
}));

export const favoriteWorkoutsRelations = relations(favoriteWorkouts, ({ one }) => ({
  user: one(users, {
    fields: [favoriteWorkouts.userId],
    references: [users.id],
  }),
  workout: one(workouts, {
    fields: [favoriteWorkouts.workoutId],
    references: [workouts.id],
  }),
}));

export const userChallengesRelations = relations(userChallenges, ({ one }) => ({
  user: one(users, {
    fields: [userChallenges.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
  createdAt: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutExerciseSchema = createInsertSchema(workoutExercises).omit({
  id: true,
});

export const insertUserWorkoutSessionSchema = createInsertSchema(userWorkoutSessions).omit({
  id: true,
  startedAt: true,
});

export const insertExerciseSetSchema = createInsertSchema(exerciseSets).omit({
  id: true,
  createdAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
  date: true,
});

export const insertFavoriteWorkoutSchema = createInsertSchema(favoriteWorkouts).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = typeof userChallenges.$inferInsert;

export const insertUserChallengeSchema = createInsertSchema(userChallenges);
export type InsertUserChallengeType = z.infer<typeof insertUserChallengeSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type InsertWorkoutExercise = z.infer<typeof insertWorkoutExerciseSchema>;
export type UserWorkoutSession = typeof userWorkoutSessions.$inferSelect;
export type InsertUserWorkoutSession = z.infer<typeof insertUserWorkoutSessionSchema>;
export type ExerciseSet = typeof exerciseSets.$inferSelect;
export type InsertExerciseSet = z.infer<typeof insertExerciseSetSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type FavoriteWorkout = typeof favoriteWorkouts.$inferSelect;
export type InsertFavoriteWorkout = z.infer<typeof insertFavoriteWorkoutSchema>;
