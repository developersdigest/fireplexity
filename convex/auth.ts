import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

export const registerUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const passwordHash = simpleHash(password);

    const userId = await ctx.db.insert("users", {
      email,
      passwordHash,
      createdAt: Date.now(),
    });

    return { userId, email };
  },
});

export const loginUser = query({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const hashedPassword = simpleHash(password);
    
    if (hashedPassword !== user.passwordHash) {
      throw new Error("Invalid email or password");
    }

    return {
      userId: user._id,
      email: user.email,
    };
  },
});

export const getCurrentUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    
    if (!user) {
      return null;
    }

    return {
      userId: user._id,
      email: user.email,
    };
  },
});
