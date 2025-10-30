"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

type Faq = { question: string; answer: string };

type EventFormState = {
  name: string;
  description: string;
  date: string;
  country: string;
  city: string;
  location: string;
  imageStorageId: Id<"_storage"> | null;
  about: string;
  accessibility: string;
  faqs: Faq[];
};

interface EditEventFormProps {
  eventId: Id<"events">;
}

export default function EditEventForm({ eventId }: EditEventFormProps) {
  const event = useQuery(api.events.get, { id: eventId });
  const updateEvent = useMutation(api.events.update);
  const generateUploadUrl = useMutation(api.events.generateUploadUrl);
  const router = useRouter();

  const [formData, setFormData] = useState<EventFormState>({
    name: "",
    description: "",
    date: "",
    country: "",
    city: "",
    location: "",
    imageStorageId: null,
    about: "",
    accessibility: "",
    faqs: [{ question: "", answer: "" }],
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load event data
  useEffect(() => {
    if (event) {
      const faqs: Faq[] = event.faqs
        ? (JSON.parse(event.faqs) as Faq[])
        : [{ question: "", answer: "" }];

      // Convert ISO date string to datetime-local format (YYYY-MM-DDTHH:mm)
      const dateValue = event.date
        ? new Date(event.date).toISOString().slice(0, 16)
        : "";

      setFormData({
        name: event.name,
        description: event.description,
        date: dateValue,
        country: event.country,
        city: event.city,
        location: event.location,
        imageStorageId: event.imageStorageId ?? null,
        about: event.about,
        accessibility: event.accessibility,
        faqs: faqs.length > 0 ? faqs : [{ question: "", answer: "" }],
      });

      if (event.imageUrl) {
        setImagePreview(event.imageUrl);
      }

      setIsLoading(false);
    }
  }, [event]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError(null);

    try {
      const uploadUrl = await generateUploadUrl({});
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Image upload failed. Please try again.");
      }

      const { storageId } = (await response.json()) as {
        storageId?: Id<"_storage">;
      };
      if (!storageId) {
        throw new Error("Upload succeeded but no storage ID was returned.");
      }

      setFormData((prev) => ({
        ...prev,
        imageStorageId: storageId,
      }));

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setObjectUrl(previewUrl);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unable to upload image.";
      setUploadError(message);
      setImagePreview(null);
      setFormData((prev) => ({ ...prev, imageStorageId: null }));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    setImagePreview(null);
    setObjectUrl(null);
    setFormData((prev) => ({ ...prev, imageStorageId: null }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.date ||
      !formData.country ||
      !formData.city ||
      !formData.location
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const validFaqs = formData.faqs.filter(
      (faq) => faq.question.trim() && faq.answer.trim()
    );

    await updateEvent({
      id: eventId,
      name: formData.name,
      description: formData.description,
      date: formData.date,
      country: formData.country,
      city: formData.city,
      location: formData.location,
      imageStorageId: formData.imageStorageId ?? undefined,
      about: formData.about,
      accessibility: formData.accessibility,
      faqs: JSON.stringify(validFaqs),
    });

    router.push(`/events/${eventId}`);
  };

  const addFaq = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }],
    }));
  };

  const removeFaq = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const updateFaq = (index: number, field: keyof Faq, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.faqs];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, faqs: updated };
    });
  };

  if (isLoading || !event) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-400/30 border-t-indigo-400"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-bold text-slate-50">
          Basic Information
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Event Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Summer Music Festival 2024"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Short Description *
            </label>
            <textarea
              placeholder="Brief tagline for your event..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Event Date &amp; Time *
            </label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Event Artwork */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-bold text-slate-50">Event Artwork</h3>
        <p className="mb-4 text-sm text-slate-400">
          Upload a cover image to showcase your event. High resolution 16:9
          images work best.
        </p>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/10 bg-white/5 md:w-72">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Event preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <ImagePlus className="h-10 w-10" />
                <span className="text-sm">No image selected</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploadingImage}
              />
              {uploadingImage ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </span>
              ) : (
                "Select Image"
              )}
            </label>

            {formData.imageStorageId && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
                Remove image
              </button>
            )}

            {uploadError && (
              <p className="text-sm text-red-300">{uploadError}</p>
            )}
            <p className="text-xs text-slate-400">
              PNG or JPEG up to 5 MB. The file is securely stored in Convex
              storage.
            </p>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-bold text-slate-50">Location</h3>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Country *
            </label>
            <input
              type="text"
              placeholder="e.g., United States"
              value={formData.country}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, country: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              City *
            </label>
            <input
              type="text"
              placeholder="e.g., New York"
              value={formData.city}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, city: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Venue *
            </label>
            <input
              type="text"
              placeholder="e.g., Madison Square Garden"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-bold text-slate-50">
          About the Event
        </h3>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Detailed Description
          </label>
          <textarea
            placeholder="Provide detailed information about your event, what attendees can expect, schedule, featured guests, etc..."
            value={formData.about}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, about: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={6}
          />
        </div>
      </div>

      {/* Accessibility */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-bold text-slate-50">Accessibility</h3>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Accessibility Information
          </label>
          <textarea
            placeholder="Describe accessibility features: wheelchair access, parking, assistance services, hearing loops, etc..."
            value={formData.accessibility}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                accessibility: e.target.value,
              }))
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={4}
          />
        </div>
      </div>

      {/* FAQs */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-50">FAQs</h3>
          <button
            type="button"
            onClick={addFaq}
            className="rounded-lg bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-300 transition hover:bg-indigo-500/30"
          >
            + Add FAQ
          </button>
        </div>

        <div className="space-y-4">
          {formData.faqs.map((faq, index) => (
            <div key={index} className="rounded-lg border border-slate-700 p-4">
              <div className="mb-3 flex items-start justify-between">
                <span className="text-sm font-semibold text-slate-400">
                  FAQ #{index + 1}
                </span>
                {formData.faqs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFaq(index)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Question
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., What time do doors open?"
                    value={faq.question}
                    onChange={(e) =>
                      updateFaq(index, "question", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Answer
                  </label>
                  <textarea
                    placeholder="Provide a clear answer..."
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, "answer", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push(`/events/${eventId}`)}
          className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={uploadingImage}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.36)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {uploadingImage ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading image...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}
