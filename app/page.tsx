"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { usePathname } from "next/navigation";
import EventList from "./components/EventList";
import MainLayout from "./components/MainLayout";
import AuthDialog from "./components/AuthDialog";
import { api } from "../convex/_generated/api";

export default function Home() {
  const pathname = usePathname();
  const currentUser = useQuery(api.users.current);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Show auth dialog on root page if user is not signed in
  useEffect(() => {
    if (pathname === "/" && currentUser !== undefined) {
      if (!currentUser && !hasCheckedAuth) {
        setShowAuthDialog(true);
        setHasCheckedAuth(true);
      } else if (currentUser) {
        setShowAuthDialog(false);
      }
    }
  }, [pathname, currentUser, hasCheckedAuth]);

  return (
    <MainLayout>
      <EventList />
      {showAuthDialog && (
        <AuthDialog onClose={() => setShowAuthDialog(false)} />
      )}
    </MainLayout>
  );
}
