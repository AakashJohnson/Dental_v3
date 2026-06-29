import { db } from '../store/db.js';
import { Notification } from '../types/index.js';
import { Role } from '../domain/enums.js';
import { id, nowIso } from '../utils/id.js';

export interface NotifyInput {
  userId: string;
  role: Role;
  applicationId?: string;
  type: string;
  title: string;
  body: string;
}

/**
 * Notification service. Notifications are role-targeted and MUST NOT leak
 * restricted college details — callers pass only safe, non-sensitive copy.
 */
export const notificationService = {
  create(input: NotifyInput): Notification {
    const n: Notification = {
      id: id('ntf'),
      read: false,
      createdAt: nowIso(),
      ...input,
    };
    return db.notifications.insert(n);
  },

  /** Notify every user holding any of the given roles. */
  notifyRoles(roles: Role[], input: Omit<NotifyInput, 'userId' | 'role'>): Notification[] {
    const recipients = db.users.find((u) => roles.includes(u.role));
    return recipients.map((u) =>
      this.create({ userId: u.id, role: u.role, ...input }),
    );
  },

  forUser(userId: string): Notification[] {
    return db.notifications
      .find((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  markRead(notificationId: string, userId: string): Notification | undefined {
    const n = db.notifications.get(notificationId);
    if (!n || n.userId !== userId) return undefined;
    return db.notifications.update(notificationId, { read: true });
  },
};
