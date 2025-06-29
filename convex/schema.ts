import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
  
  conversations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  
  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    sources: v.optional(v.array(v.object({
      title: v.string(),
      url: v.string(),
      content: v.string(),
      favicon: v.optional(v.string()),
    }))),
    followUpQuestions: v.optional(v.array(v.string())),
    ticker: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),
});
