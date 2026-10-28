import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '@/state/auth';
import { GameProvider } from '@/state/game';
import { LanguageProvider, useLanguage } from '@/state/language';
import { LottoProvider } from '@/state/lotto';
import { MyWordsProvider } from '@/state/my-words';
import { ProfileProvider } from '@/state/profile';
import { StreakProvider } from '@/state/streak';
import { WordFiltersProvider } from '@/state/word-filters';
import { FontAssets } from '@/theme/fonts';
import { usePalette } from '@/theme/use-palette';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const p = usePalette();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: p.surface }}>
      <AuthProvider>
        <ProfileProvider>
          <LanguageProvider>
            <MyWordsProvider>
              <StreakProvider>
                <LottoProvider>
                  <GameProvider>
                    <WordFiltersProvider>
                      <StatusBar style="dark" />
                      <RootStack />
                    </WordFiltersProvider>
                  </GameProvider>
                </LottoProvider>
              </StreakProvider>
            </MyWordsProvider>
          </LanguageProvider>
        </ProfileProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

/** Keeps the splash up until fonts, the saved session and the learner's saved language are ready, then shows login or the app. */
function RootStack() {
  const p = usePalette();
  const { session, loading } = useAuth();
  const { loading: languageLoading } = useLanguage();
  const [fontsLoaded, fontError] = useFonts(FontAssets);
  const ready = (fontsLoaded || !!fontError) && !loading && !languageLoading;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const signedIn = !!session;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.surface } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="language" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="profile" />
        <Stack.Screen name="lotto" />
        <Stack.Screen name="words" />
        <Stack.Screen name="add-word" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="level-map" />
        <Stack.Screen name="rewards" />
        <Stack.Screen name="filters" options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: p.grapeSoft } }} />
        <Stack.Screen name="card/[id]" />
        <Stack.Screen name="exercises" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="kitchen" />
        <Stack.Screen name="match" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="study" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      </Stack.Protected>
    </Stack>
  );
}
