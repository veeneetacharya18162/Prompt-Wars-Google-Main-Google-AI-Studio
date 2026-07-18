/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  displayName: string;
  createdAt: string;
  ageConfirmed: boolean;
  aiPersonalizationEnabled: boolean;
  analyticsEnabled: boolean;
}

export type HabitCategory =
  | 'Alcohol'
  | 'Smoking/Vaping'
  | 'Substances'
  | 'Gambling'
  | 'Digital/Screen Time'
  | 'Other';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  category: HabitCategory;
  goal: string;
  triggers: string[];
  createdAt: string;
  streak: number;
  lastCleanDate: string; // YYYY-MM-DD
}

export type EntryType = 'urge' | 'relapse' | 'clean_day';

export interface Entry {
  id: string;
  userId: string;
  habitId: string;
  timestamp: string;
  type: EntryType;
  intensity?: number; // 1 to 10
  notes?: string;
  trigger?: string;
  mood?: string;
}

export interface Journal {
  id: string;
  userId: string;
  title?: string;
  content: string;
  mood?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentCategory: 'essential' | 'ai_personalization' | 'analytics';
  status: boolean;
  noticeVersion: string;
  timestamp: string;
}
