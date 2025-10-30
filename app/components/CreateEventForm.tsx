"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateEventForm() {
  const createEvent = useMutation(api.events.create);
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    country: "",
    city: "",
    location: "",
    imageUrl: "",
    about: "",
    accessibility: "",
    faqs: [{ question: "", answer: "" }],
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.country || !formData.city || !formData.location) {
      alert("Please fill in all required fields");
      return;
    }

    // Filter out empty FAQs
    const validFaqs = formData.faqs.filter(faq => faq.question.trim() && faq.answer.trim());

    await createEvent({
      name: formData.name,
      description: formData.description,
      date: formData.date,
      country: formData.country,
      city: formData.city,
      location: formData.location,
      imageUrl: formData.imageUrl || undefined,
      about: formData.about,
      accessibility: formData.accessibility,
      faqs: JSON.stringify(validFaqs),
    });

    // Redirect to my events page
    router.push("/my-events");
  };

  const addFaq = () => {
    setFormData({
      ...formData,
      faqs: [...formData.faqs, { question: "", answer: "" }],
    });
  };

  const removeFaq = (index: number) => {
    setFormData({
      ...formData,
      faqs: formData.faqs.filter((_, i) => i !== index),
    });
  };

  const updateFaq = (index: number, field: "question" | "answer", value: string) => {
    const newFaqs = [...formData.faqs];
    newFaqs[index][field] = value;
    setFormData({ ...formData, faqs: newFaqs });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="border border-white/10 rounded-2xl bg-slate-900/80 shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-50 mb-4">📋 Basic Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Event Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Summer Music Festival 2024"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-slate-700 bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Short Description *
            </label>
            <textarea
              placeholder="Brief tagline for your event..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-700 bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Event Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 border border-slate-700 bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Event Image URL (optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-700 bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="border border-white/10 rounded-2xl bg-slate-900/80 shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-50 mb-4">📍 Location</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Country *
              </label>
              <input
                type="text"
                placeholder="e.g., United States"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-700 bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                City *
              </label>
              <input
                type="text"
                placeholder="e.g., New York"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-700 bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Venue Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Madison Square Garden"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-700 bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
              required
            />
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="border border-white/10 rounded-2xl bg-slate-900/80 shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-50 mb-4">📝 About the Event</h3>
        
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Detailed Description
          </label>
          <textarea
            placeholder="Provide detailed information about your event, what attendees can expect, schedule, featured guests, etc..."
            value={formData.about}
            onChange={(e) =>
              setFormData({ ...formData, about: e.target.value })
            }
            className="w-full px-4 py-3 border border-slate-700 bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
            rows={6}
          />
        </div>
      </div>

      {/* Accessibility Section */}
      <div className="border border-white/10 rounded-2xl bg-slate-900/80 shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-50 mb-4">♿ Accessibility</h3>
        
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Accessibility Information
          </label>
          <textarea
            placeholder="Describe accessibility features: wheelchair access, parking, assistance services, hearing loops, etc..."
            value={formData.accessibility}
            onChange={(e) =>
              setFormData({ ...formData, accessibility: e.target.value })
            }
            className="w-full px-4 py-3 border border-slate-700 bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
            rows={4}
          />
        </div>
      </div>

      {/* FAQs Section */}
      <div className="border border-white/10 rounded-2xl bg-slate-900/80 shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-50">❓ FAQs</h3>
          <button
            type="button"
            onClick={addFaq}
            className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm font-semibold"
          >
            + Add FAQ
          </button>
        </div>
        
        <div className="space-y-4">
          {formData.faqs.map((faq, index) => (
            <div key={index} className="border border-slate-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-semibold text-slate-400">FAQ #{index + 1}</span>
                {formData.faqs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFaq(index)}
                    className="text-red-500 hover:text-red-400 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Question
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., What time do doors open?"
                    value={faq.question}
                    onChange={(e) => updateFaq(index, "question", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-700 bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Answer
                  </label>
                  <textarea
                    placeholder="Provide a clear answer..."
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, "answer", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-700 bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg shadow-lg"
        >
          Create Event
        </button>
        <button
          type="button"
          onClick={() => router.push("/my-events")}
          className="px-8 py-4 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
