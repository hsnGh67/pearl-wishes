import { supabase } from '../../config/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { dbLogger } from './logger';

/**
 * Realtime subscription manager for syncing data between Public and Admin
 */

type ChangeCallback<T> = (payload: RealtimePostgresChangesPayload<T>) => void;

export class RealtimeSync {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to table changes
   */
  subscribe<T = any>(
    table: string,
    options: {
      onInsert?: ChangeCallback<T>;
      onUpdate?: ChangeCallback<T>;
      onDelete?: ChangeCallback<T>;
    }
  ): () => void {
    const channelName = `${table}_changes`;

    if (this.channels.has(channelName)) {
      dbLogger.warn('Already subscribed to table', { table });
      return () => this.unsubscribe(channelName);
    }

    dbLogger.info('Subscribing to realtime changes', { table });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table,
        },
        (payload) => {
          dbLogger.info('Realtime INSERT event', { table, data: payload });
          options.onInsert?.(payload as RealtimePostgresChangesPayload<T>);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table,
        },
        (payload) => {
          dbLogger.info('Realtime UPDATE event', { table, data: payload });
          options.onUpdate?.(payload as RealtimePostgresChangesPayload<T>);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table,
        },
        (payload) => {
          dbLogger.info('Realtime DELETE event', { table, data: payload });
          options.onDelete?.(payload as RealtimePostgresChangesPayload<T>);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribe(channelName);
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      dbLogger.info('Unsubscribing from realtime changes', { channel: channelName });
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    dbLogger.info('Unsubscribing from all realtime channels');
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    });
  }

  /**
   * Check if subscribed to a table
   */
  isSubscribed(table: string): boolean {
    return this.channels.has(`${table}_changes`);
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.channels.keys());
  }
}

// Export singleton instance
export const realtimeSync = new RealtimeSync();

/**
 * Convenience hooks for common tables
 */

export const subscribeToServices = (callbacks: {
  onInsert?: ChangeCallback<any>;
  onUpdate?: ChangeCallback<any>;
  onDelete?: ChangeCallback<any>;
}) => {
  return realtimeSync.subscribe('services', callbacks);
};

export const subscribeToCategories = (callbacks: {
  onInsert?: ChangeCallback<any>;
  onUpdate?: ChangeCallback<any>;
  onDelete?: ChangeCallback<any>;
}) => {
  return realtimeSync.subscribe('categories', callbacks);
};

export const subscribeToTestimonials = (callbacks: {
  onInsert?: ChangeCallback<any>;
  onUpdate?: ChangeCallback<any>;
  onDelete?: ChangeCallback<any>;
}) => {
  return realtimeSync.subscribe('testimonials', callbacks);
};

export const subscribeToBookings = (callbacks: {
  onInsert?: ChangeCallback<any>;
  onUpdate?: ChangeCallback<any>;
  onDelete?: ChangeCallback<any>;
}) => {
  return realtimeSync.subscribe('bookings', callbacks);
};

export const subscribeToUsers = (callbacks: {
  onInsert?: ChangeCallback<any>;
  onUpdate?: ChangeCallback<any>;
  onDelete?: ChangeCallback<any>;
}) => {
  return realtimeSync.subscribe('users', callbacks);
};

export const subscribeToContent = (callbacks: {
  onInsert?: ChangeCallback<any>;
  onUpdate?: ChangeCallback<any>;
  onDelete?: ChangeCallback<any>;
}) => {
  return realtimeSync.subscribe('content_sections', callbacks);
};

export const subscribeToWorkshops = (callbacks: {
  onInsert?: ChangeCallback<any>;
  onUpdate?: ChangeCallback<any>;
  onDelete?: ChangeCallback<any>;
}) => {
  return realtimeSync.subscribe('workshops', callbacks);
};