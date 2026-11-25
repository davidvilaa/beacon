"use client";

import { useProfile } from "@/components/profile/ProfileContext";
import ProfileNetworkTab from "@/components/profile/ProfileNetworkTab";

export default function ProfileNetworkPage() {
  const { profileUser, isLoadingProfile } = useProfile();

  if (isLoadingProfile || !profileUser) {
    return null;
  }

  return <ProfileNetworkTab profileUser={profileUser} />;
}
