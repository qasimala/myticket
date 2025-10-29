"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FormEvent, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

export default function TaskList() {
  const tasks = useQuery(api.tasks.get);
  const createTask = useMutation(api.tasks.create);
  const toggleTask = useMutation(api.tasks.toggle);
  const removeTask = useMutation(api.tasks.remove);
  const [newTaskText, setNewTaskText] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      await createTask({ text: newTaskText });
      setNewTaskText("");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">My Tasks</h1>
      
      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {tasks === undefined ? (
          <p className="text-gray-500 text-center">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500 text-center">No tasks yet. Add one above!</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <input
                type="checkbox"
                checked={task.isCompleted}
                onChange={() => toggleTask({ id: task._id as Id<"tasks"> })}
                className="w-5 h-5 cursor-pointer"
              />
              <span
                className={`flex-1 ${
                  task.isCompleted
                    ? "line-through text-gray-400"
                    : "text-gray-800"
                }`}
              >
                {task.text}
              </span>
              <button
                onClick={() => removeTask({ id: task._id as Id<"tasks"> })}
                className="px-3 py-1 text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

