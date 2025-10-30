"use client";

import { useParams } from "next/navigation";
import MainLayout from "../../../components/MainLayout";
import EditEventForm from "../../../components/EditEventForm";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.id as Id<"events">;

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50">Edit Event</h1>
        <p className="text-slate-400 mt-1">
          Update your event details and information
        </p>
      </div>
      <EditEventForm eventId={eventId} />
    </MainLayout>
  );
}
