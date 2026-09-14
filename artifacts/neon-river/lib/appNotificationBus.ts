export interface ServerAppNotification {
  notificationId: string;
  type: 'follow' | 'like' | 'comment' | 'direct_message';
  title: string;
  message?: string | null;
  reason: string;
  createdAt: string;
  read?: boolean;
}

type Listener = (notification: ServerAppNotification) => void;

const listeners = new Set<Listener>();
const pending: ServerAppNotification[] = [];

export function publishServerNotification(notification: ServerAppNotification) {
  if (listeners.size === 0) {
    pending.push(notification);
    return;
  }
  listeners.forEach(listener => listener(notification));
}

export function subscribeServerNotifications(listener: Listener) {
  listeners.add(listener);
  if (pending.length > 0) {
    const queued = pending.splice(0);
    queued.forEach(listener);
  }
  return () => {
    listeners.delete(listener);
  };
}