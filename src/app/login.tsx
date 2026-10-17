import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, type TextInputProps } from 'react-native';

import { LottoMascot } from '@/components/art/lotto-mascot';
import { Screen } from '@/components/screen';
import { PillButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import { useAuth } from '@/state/auth';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/** Error text on the cream surface: a dark red that keeps 4.5:1. */
const DangerText = '#c42f2f';

type Mode = 'signIn' | 'signUp';

export default function LoginScreen() {
  const p = usePalette();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>('signIn');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const signingUp = mode === 'signUp';
  const canSubmit = email.trim() !== '' && password !== '' && (!signingUp || username.trim() !== '');

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (signingUp) {
        const { needsConfirmation } = await signUp(email.trim(), password, username.trim());
        if (needsConfirmation) {
          setNotice('Check your email to confirm your account, then sign in.');
          setMode('signIn');
        }
      } else {
        await signIn(email.trim(), password);
      }
      // On success the session changes and the root layout swaps this screen out.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(signingUp ? 'signIn' : 'signUp');
    setError(null);
    setNotice(null);
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: Space[4], paddingVertical: Space[6] }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', gap: Space[2] }}>
            <LottoMascot line={p.line} width={120} pose="wave" />
            <Txt variant="displayLg" accessibilityRole="header" style={{ textAlign: 'center' }}>
              Lingo Lotto
            </Txt>
            <Txt variant="bodyLg" color={p.inkMuted} style={{ textAlign: 'center' }}>
              {signingUp ? 'Make an account to start collecting words.' : 'Welcome back! Sign in to keep pulling.'}
            </Txt>
          </View>

          <View style={{ gap: Space[3] }}>
            {signingUp && (
              <Field
                label="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoComplete="username-new"
                textContentType="username"
              />
            )}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={signingUp ? 'new-password' : 'current-password'}
              textContentType={signingUp ? 'newPassword' : 'password'}
              returnKeyType="go"
              onSubmitEditing={submit}
            />
          </View>

          {error && (
            <Txt accessibilityRole="alert" color={DangerText} style={{ fontFamily: Font.body800, textAlign: 'center' }}>
              {error}
            </Txt>
          )}
          {notice && (
            <Txt accessibilityRole="alert" style={{ fontFamily: Font.body800, textAlign: 'center' }}>
              {notice}
            </Txt>
          )}

          <PillButton
            label={busy ? 'One moment…' : signingUp ? 'Create account' : 'Sign in'}
            fill={p.pink}
            disabled={!canSubmit || busy}
            onPress={submit}
            style={{ opacity: canSubmit ? 1 : 0.6 }}
          />

          <Pressable accessibilityRole="button" onPress={switchMode} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Txt style={{ fontFamily: Font.body800, textDecorationLine: 'underline' }}>
              {signingUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </Txt>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({ label, ...input }: TextInputProps & { label: string }) {
  const p = usePalette();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="label" style={{ paddingLeft: Space[1] }}>
        {label}
      </Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={p.inkMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          minHeight: 52,
          paddingHorizontal: Space[4],
          backgroundColor: p.surfaceRaised,
          borderColor: focused ? p.focus : p.line,
          borderWidth: Stroke[2],
          borderRadius: Radius.md,
          color: p.ink,
          fontFamily: Font.body700,
          fontSize: 16,
        }}
        {...input}
      />
    </View>
  );
}
