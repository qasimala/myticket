import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get all tasks
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

// Mutation to create a new task
export const create = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", { 
      text: args.text,
      isCompleted: false 
    });
    return taskId;
  },
});

// Mutation to toggle task completion
export const toggle = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");
    await ctx.db.patch(args.id, { 
      isCompleted: !task.isCompleted 
    });
  },
});

// Mutation to delete a task
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

