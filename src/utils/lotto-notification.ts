import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Fixed, so there's only ever one pending "pull ready" notification. */
const NotificationId = 'lotto-pull-ready';
const ChannelId = 'lotto';
// expo-notifications can't schedule on web.
const Supported = Platform.OS !== 'web';
/** Android can keep `canAskAgain` true after a "no", so ask at most once per app run. */
let asked = false;

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ChannelId, { name: 'Lotto', importance: Notifications.AndroidImportance.DEFAULT });
}

/** Asks for permission if it hasn't been asked yet. Call it after a pull, never on launch. */
export async function askForLottoNotifications() {
  if (!Supported) return false;
  // Android 13 only shows the permission prompt once a channel exists.
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !current.canAskAgain || asked) return current.granted;
  asked = true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * Replaces any pending lotto notification with one at `at` (device time), or just cancels it when `at` is null.
 * Does nothing without notification permission.
 */
export async function syncLottoNotification(at: Date | null) {
  if (!Supported) return;
  await Notifications.cancelScheduledNotificationAsync(NotificationId);
  if (!at || at.getTime() <= Date.now()) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: NotificationId,
    content: { title: 'Your Lingo Lotto is ready 🎰' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: ChannelId },
  });
}
