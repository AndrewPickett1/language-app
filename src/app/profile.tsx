import { Children, Fragment, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Capsule } from '@/components/art/capsule';
import { CameraIcon, ChevronIcon, FlameIcon, HelpIcon, MailIcon, PersonIcon, SpeakerIcon } from '@/components/icons';
import { Screen, ScreenHeader } from '@/components/screen';
import { Panel, RoundButton, Sticker } from '@/components/sticker';
import { Switch } from '@/components/switch';
import { Txt } from '@/components/text';
import { useAuth } from '@/state/auth';
import { useGame } from '@/state/game';
import { useStreak } from '@/state/streak';
import { useProfile, type Settings } from '@/state/profile';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke, shadowPop } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/** Log out is destructive, so its label is a dark red that keeps 4.5:1 on white. */
const DangerText = '#c42f2f';

export default function ProfileScreen() {
  const p = usePalette();
  const { name, email, initials, settings, setSetting } = useProfile();
  const { signOut } = useAuth();
  const { collected } = useGame();
  const { streak } = useStreak();
  const [signingOut, setSigningOut] = useState(false);

  // On success the session clears and the root layout sends us back to login.
  const logOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      setSigningOut(false);
      Alert.alert("Couldn't log out", e instanceof Error ? e.message : 'Try again.');
    }
  };

  const toggle = (key: keyof Settings) => (on: boolean) => setSetting(key, on);

  return (
    <Screen style={{ gap: Space[3], paddingBottom: 0 }} edges={['top', 'left', 'right']}>
      <ScreenHeader
        backLabel="Back to home"
        fallback="/"
        center={
          <Txt accessibilityRole="header" style={{ flex: 1, textAlign: 'center', fontFamily: Font.display700, fontSize: 24, lineHeight: 28 }}>
            Profile
          </Txt>
        }
        trailing={<View style={{ width: 48 }} />}
      />

      <ScrollView
        style={{ flex: 1, marginHorizontal: -Space[4] }}
        contentContainerStyle={{ gap: 18, paddingHorizontal: Space[4], paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', gap: 10, paddingTop: Space[1] }}>
          <View style={{ width: 120, height: 120 }}>
            <View
              accessibilityLabel={`${name}'s profile picture`}
              style={{
                width: 120,
                height: 120,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: p.grape,
                borderColor: p.line,
                borderWidth: Stroke[3],
                borderRadius: Radius.pill,
                boxShadow: shadowPop(p.line, 5),
              }}>
              <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 48, lineHeight: 52 }}>
                {initials}
              </Txt>
            </View>
            <RoundButton
              accessibilityLabel="Change profile picture"
              fill={p.sunshine}
              size={42}
              lift={3}
              style={{ position: 'absolute', right: -4, bottom: -2 }}>
              <CameraIcon color={p.onBright} fill={p.paper} />
            </RoundButton>
          </View>
          <View style={{ marginTop: 6, alignItems: 'center' }}>
            <Txt style={{ fontFamily: Font.display700, fontSize: 30, lineHeight: 34 }}>{name}</Txt>
            {email !== '' && (
              <Txt color={p.inkMuted} style={{ fontFamily: Font.body700, fontSize: 15, lineHeight: 20 }}>
                {email}
              </Txt>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: Space[2] }}>
            <StatChip fill={p.tangerine} icon={<FlameIcon line={p.line} size={14} />} label={`${streak}-day streak`} />
            <StatChip fill={p.sky} label={`${collected.length} words`} />
          </View>
        </View>

        <Group title="Learning">
          <Row icon={<SpeakerIcon color={p.onBright} fill={p.paper} size={16} />} iconFill={p.sunshine} label="Sound effects">
            <Switch accessibilityLabel="Sound effects" value={settings.soundEffects} onValueChange={toggle('soundEffects')} />
          </Row>
        </Group>

        <Group title="Notifications">
          <Row icon={<FlameIcon line={p.line} size={16} />} iconFill={p.tangerine} label="Streak reminder" detail="Every day at 7:00 PM">
            <Switch accessibilityLabel="Streak reminder" value={settings.streakReminder} onValueChange={toggle('streakReminder')} />
          </Row>
          <Row icon={<Capsule color={p.sunshine} line={p.line} size={18} shine={false} stroke={6} />} iconFill={p.pink} label="Pull ready alerts">
            <Switch accessibilityLabel="Pull ready alerts" value={settings.pullAlerts} onValueChange={toggle('pullAlerts')} />
          </Row>
        </Group>

        <Group title="Account">
          <LinkRow icon={<PersonIcon color={p.onBright} fill={p.paper} />} iconFill={p.grape} label="Edit profile" />
          <LinkRow icon={<MailIcon color={p.onBright} fill={p.paper} />} iconFill={p.sky} label="Email & password" />
          <LinkRow icon={<HelpIcon color={p.onBright} />} iconFill={p.sunshineSoft} label="Help & feedback" />
        </Group>

        <Sticker
          accessibilityRole="button"
          fill={p.surfaceRaised}
          disabled={signingOut}
          onPress={logOut}
          style={{ minHeight: 54, alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="button" color={DangerText}>
            {signingOut ? 'Logging out…' : 'Log out'}
          </Txt>
        </Sticker>
      </ScrollView>
    </Screen>
  );
}

function StatChip({ fill, icon, label }: { fill: string; icon?: ReactNode; label: string }) {
  const p = usePalette();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 3,
        paddingLeft: icon ? Space[2] : 11,
        paddingRight: 11,
        backgroundColor: fill,
        borderColor: p.line,
        borderWidth: Stroke[1],
        borderRadius: Radius.pill,
      }}>
      {icon}
      <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 13, lineHeight: 18 }}>
        {label}
      </Txt>
    </View>
  );
}

/** A titled card of rows, with dividers between them. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ gap: Space[2] }}>
      <Txt variant="caption" accessibilityRole="header" color={p.inkMuted} style={{ paddingLeft: Space[1], fontFamily: Font.body900 }}>
        {title}
      </Txt>
      <Panel fill={p.surfaceRaised} radius={22} borderWidth={Stroke[2]} style={{ overflow: 'hidden' }}>
        {Children.toArray(children).map((row, i) => (
          <Fragment key={i}>
            {i > 0 && <View style={{ height: Stroke[1], backgroundColor: p.surfaceSunken }} />}
            {row}
          </Fragment>
        ))}
      </Panel>
    </View>
  );
}

type RowProps = { icon: ReactNode; iconFill: string; label: string; detail?: string; children?: ReactNode };

function RowContent({ icon, iconFill, label, detail, children }: RowProps) {
  const p = usePalette();
  return (
    <>
      <View
        style={{
          width: 32,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: iconFill,
          borderColor: p.line,
          borderWidth: Stroke[2],
          borderRadius: Radius.pill,
        }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Txt style={{ fontFamily: Font.body800, fontSize: 16, lineHeight: 20 }}>{label}</Txt>
        {detail && (
          <Txt color={p.inkMuted} style={{ fontFamily: Font.body700, fontSize: 13, lineHeight: 17 }}>
            {detail}
          </Txt>
        )}
      </View>
      {children}
    </>
  );
}

const rowStyle = { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: Space[3], paddingVertical: 10, paddingHorizontal: 14 } as const;

function Row(props: RowProps) {
  return (
    <View style={rowStyle}>
      <RowContent {...props} />
    </View>
  );
}

function LinkRow({ onPress, ...props }: Omit<RowProps, 'children'> & { onPress?: () => void }) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      onPress={onPress}
      style={({ pressed }) => [rowStyle, { backgroundColor: pressed ? p.surface : 'transparent' }]}>
      <RowContent {...props}>
        <ChevronIcon color={p.ink} size={12} direction="right" />
      </RowContent>
    </Pressable>
  );
}
