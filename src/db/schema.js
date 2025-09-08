import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const favoritesTable = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  recipeId: integer("recipe_id").notNull(),
  title: text("title").notNull(),
  image: text("image"),
  cookTime: text("cook_time"),
  servings: text("servings"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recipesTable = pgTable("recipes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), 
  image: text("image"),
  instructions: text("instructions").notNull(),
  ingredients: text("ingredients").notNull(),
  cook_time: integer("cook_time"),
  servings: text("servings"),
  categoryId: integer("category_id").references(() => categoriesTable.id),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});