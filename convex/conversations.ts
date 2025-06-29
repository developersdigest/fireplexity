import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createConversation = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const conversationId = await ctx.db.insert("conversations", {
      userId: args.userId,
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });
    
    return conversationId;
  },
});

export const getUserConversations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    return conversations;
  },
});

export const getConversationMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();
    
    return messages;
  },
});

export const addMessage = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      sources: args.sources,
      followUpQuestions: args.followUpQuestions,
      ticker: args.ticker,
      createdAt: Date.now(),
    });
    
    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });
    
    return messageId;
  },
});

export const updateConversationTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    await ctx.db.delete(args.conversationId);
  },
});
