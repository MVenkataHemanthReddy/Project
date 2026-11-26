import { registerActivityLogListener } from './listeners/activityLogListener';
import { registerNotificationListener } from './listeners/notificationListener';
import { registerEmailNotifierListener } from './listeners/emailNotifierListener';

export function initializeEventSubscribers(): void {
  registerActivityLogListener();
  registerNotificationListener();
  registerEmailNotifierListener();
  console.log('[Events] All event subscribers successfully registered.');
}
