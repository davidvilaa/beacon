"use client";

import { createContext, useContext } from "react";

export interface ProfileSocialLink {
  platform: string;
  value: string;
}

export interface ProfileUser {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  social_links: ProfileSocialLink[] | null;
}

interface ProfileContextValue {
  profileUser: ProfileUser | null;
  isOwner: boolean;
  isLoadingProfile: boolean;
}

const ProfileContext = createContext<ProfileContextValue>({
  profileUser: null,
  isOwner: false,
  isLoadingProfile: true,
});

export function ProfileProvider({
  value,
  children,
}: {
  value: ProfileContextValue;
  children: React.ReactNode;
}) {
  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
