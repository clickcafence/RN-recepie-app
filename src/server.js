import express from 'express';
import { ENV } from './config/env.js';
import { db } from "./config/db.js";
import { favoritesTable, categoriesTable, recipesTable } from "./db/schema.js";
import job from "./config/cron.js";
import { and, eq, desc, ilike, or } from "drizzle-orm";

const app = express();
const PORT = ENV.PORT || 3000;


if (ENV.NODE_ENV === "production") job.start();

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true });
});

app.use(express.json());

// 📌 Get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await db.select().from(categoriesTable);
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});
// 📌 Get all recipes (optionally by category)
app.get("/api/recipes", async (req, res) => {
  try {
    const { categoryId } = req.query;

    let query = db.select().from(recipesTable).orderBy(desc(recipesTable.createdAt));

    if (categoryId) {
      query = query.where(eq(recipesTable.categoryId, parseInt(categoryId)));
    }

    const recipes = await query;
    res.status(200).json(recipes);
  } catch (error) {
    console.error("Error fetching recipes", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 📌 Add new recipe
app.post("/api/recipes", async (req, res) => {
  try {
    const { userId, categoryId, title, instructions, image, ingredients, cook_time, servings } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newRecipe = await db
      .insert(recipesTable)
      .values({
        userId,
        categoryId,
        title,
        instructions,
        ingredients,
        cook_time: cook_time || cookTime,
        servings,
        image
      })
      .returning();

    res.status(201).json(newRecipe[0]);
  } catch (error) {
    console.error("Error adding recipe", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 📌 Get single recipe by ID
app.get("/api/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const recipe = await db
      .select()
      .from(recipesTable)
      .where(eq(recipesTable.id, parseInt(id)));

    if (recipe.length === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.status(200).json(recipe[0]);
  } catch (error) {
    console.error("Error fetching recipe", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /api/recipes/search?query=chicken
app.get("/api/recipes/search", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ error: "Query is required" });
    }

    const results = await db
      .select()
      .from(recipesTable)
      .where(
        or(
          ilike(recipesTable.title, `%${query}%`),         // search in title
          ilike(recipesTable.ingredients, `%${query}%`)   // search in ingredients
        )
      );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error searching recipes:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/api/favorites", async (req, res) => {
  try {
    const { userId, recipeId, title, image, cook_time, servings } = req.body;

    if (!userId || !recipeId || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newFavorite = await db
      .insert(favoritesTable)
      .values({
        userId,
        recipeId,
        title,
        image,
        cook_time: cook_time || cookTime, 
        servings,
      })
      .returning();

    res.status(201).json(newFavorite[0]);
  } catch (error) {
    console.log("Error adding favorite", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/favorites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const userFavorites = await db
      .select()
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, userId));

    res.status(200).json(userFavorites);
  } catch (error) {
    console.log("Error fetching the favorites", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.delete("/api/favorites/:userId/:recipeId", async (req, res) => {
  try {
    const { userId, recipeId } = req.params;

    await db
      .delete(favoritesTable)
      .where(
        and(eq(favoritesTable.userId, userId), eq(favoritesTable.recipeId, parseInt(recipeId)))
      );

    res.status(200).json({ message: "Favorite removed successfully" });
  } catch (error) {
    console.log("Error removing a favorite", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
