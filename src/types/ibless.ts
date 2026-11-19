import type { Timestamp } from 'firebase/firestore';

export type BlessingCategoryId =
  | 'prosperity'
  | 'good_health'
  | 'love'
  | 'happiness'
  | 'wisdom'
  | 'success'
  | 'good_fortune'
  | 'peace'
  | 'protection'
  | 'gratitude'
  | 'friendship'
  | 'general_goodwill'
  | 'custom';

export type CardStyleId =
  | 'sunbeam'
  | 'mint'
  | 'lavender'
  | 'coral'
  | 'sky'
  | 'midnight';

export type BlessingVisibility = 'private' | 'public';

export type BlessingStatus = 'dispatched' | 'delivered' | 'read' | 'acknowledged';

export type ReactionKey = 'heart' | 'pray' | 'sparkle' | 'smile';

export type RequestStatus = 'open' | 'fulfilled' | 'closed';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export type NotificationType =
  | 'blessing_received'
  | 'blessing_acknowledged'
  | 'request_received'
  | 'request_fulfilled'
  | 'connection_request'
  | 'connection_accepted'
  | 'public_reaction'
  | 'achievement_unlocked'
  | 'level_up';

export interface UserStatistics {
  sentCount: number;
  receivedCount: number;
  acknowledgedCount: number;
  savedCount: number;
  connectionsCount: number;
}

export interface UserStreak {
  current: number;
  longest: number;
  lastActiveDate: string; // YYYY-MM-DD in local timezone
}

export interface UserPreferences {
  defaultVisibility: BlessingVisibility;
  allowRequestsFromAnyone: boolean;
  browserNotifications: boolean;
  theme: 'light' | 'dark';
}

export interface UserPublic {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  discoverable: boolean;
  onboardingComplete: boolean;
  currentLevel: number;
  statistics: UserStatistics;
  streak: UserStreak;
  preferences: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserPrivate {
  uid: string;
  email: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Blessing {
  blessingId: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderPhotoURL?: string;
  recipientId: string;
  recipientName: string;
  recipientUsername: string;
  recipientIds: string[];
  message: string;
  category: BlessingCategoryId;
  templateId?: string;
  cardStyle: CardStyleId;
  visibility: BlessingVisibility;
  status: BlessingStatus;
  thankYouNote?: string;
  reactions: Record<ReactionKey, number>;
  countedByRecipient: boolean;
  requestId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  readAt?: Timestamp | null;
  acknowledgedAt?: Timestamp | null;
}

export interface BlessingReaction {
  reactionId: string;
  blessingId: string;
  userId: string;
  emoji: ReactionKey;
  createdAt: Timestamp;
}

export interface BlessingRequest {
  requestId: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  recipientId: string;
  recipientName: string;
  recipientUsername: string;
  message: string;
  category: BlessingCategoryId;
  visibility: BlessingVisibility;
  status: RequestStatus;
  responseCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  fulfilledAt?: Timestamp | null;
}

export interface Connection {
  connectionId: string;
  requesterId: string;
  recipientId: string;
  participants: string[];
  requesterName: string;
  requesterUsername: string;
  recipientName: string;
  recipientUsername: string;
  status: ConnectionStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AppNotification {
  notificationId: string;
  userId: string;
  actorId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId: string;
  linkPath: string;
  read: boolean;
  createdAt: Timestamp;
}

export interface SavedBlessingSnapshot {
  message: string;
  category: string;
  senderName: string;
  senderUsername?: string;
  recipientName: string;
  cardStyle: CardStyleId;
  createdAtLabel: string;
}

export interface SavedBlessing {
  saveId: string;
  userId: string;
  blessingId: string;
  sourceType: 'blessing' | 'daily';
  blessingSnapshot: SavedBlessingSnapshot;
  savedAt: Timestamp;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Timestamp;
}

export interface BlockRecord {
  blockId: string;
  blockerId: string;
  blockedId: string;
  blockedUsername: string;
  createdAt: Timestamp;
}

export interface DailyBlessingItem {
  id: string;
  message: string;
  category: BlessingCategoryId;
  note: string;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (stats: UserStatistics, streak: UserStreak, extras?: { publicCount?: number; fulfilledRequestCount?: number }) => boolean;
  progressLabel: (stats: UserStatistics, streak: UserStreak) => string;
}

export interface LevelDefinition {
  level: number;
  title: string;
  badgeEmoji: string;
  minScore: number;
  description: string;
  perksNote: string;
}
