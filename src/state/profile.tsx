import { createContext, use, useState, type ReactNode } from 'react';

import { useAuth } from '@/state/auth';

export type Settings = {
  soundEffects: boolean;
  streakReminder: boolean;
  pullAlerts: boolean;
};

type Profile = {
  name: string;
  email: string;
  initials: string;
  settings: Settings;
  setSetting: (key: keyof Settings, on: boolean) => void;
};

const ProfileContext = createContext<Profile | null>(null);

/** The signed-in learner's name and app settings. Settings aren't persisted yet. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({ soundEffects: true, streakReminder: true, pullAlerts: false });

  const email = user?.email ?? '';
  // The username chosen at sign-up, or the part of the email before the @.
  const name: string = user?.user_metadata?.username || email.split('@')[0];

  const profile: Profile = {
    name,
    email,
    initials: name.slice(0, 2).toUpperCase(),
    settings,
    setSetting: (key, on) => setSettings((s) => ({ ...s, [key]: on })),
  };
  return <ProfileContext value={profile}>{children}</ProfileContext>;
}

export function useProfile() {
  const profile = use(ProfileContext);
  if (!profile) throw new Error('useProfile must be used inside <ProfileProvider>');
  return profile;
}
