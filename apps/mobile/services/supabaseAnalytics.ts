import { supabase } from '../lib/supabase';

export interface PlayEventInput {
  contentId: string;
  contentType: string;
  title: string;
  source?: string;
}

export async function trackPlayEvent(input: PlayEventInput): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    await supabase.from('user_play_events').insert({
      user_id: user.id,
      content_id: input.contentId,
      content_type: input.contentType,
      content_title: input.title,
      source_screen: input.source ?? 'unknown',
      played_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('trackPlayEvent skipped:', error);
  }
}

export async function subscribeToLiveAlerts(channelId: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    await supabase.from('live_subscriptions').upsert({
      user_id: user.id,
      channel_id: channelId,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('subscribeToLiveAlerts skipped:', error);
  }
}

export async function fetchUserProfileMetrics() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        email: '',
        displayName: 'Guest User',
        totalPlays: 0,
        liveSubscriptions: 0,
      };
    }

    const [{ count: playsCount }, { count: subscriptionsCount }] = await Promise.all([
      supabase.from('user_play_events').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('live_subscriptions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    return {
      email: user.email ?? '',
      displayName: (user.user_metadata?.display_name as string | undefined) ?? 'ClaudyGod User',
      totalPlays: playsCount ?? 0,
      liveSubscriptions: subscriptionsCount ?? 0,
    };
  } catch {
    return {
      email: '',
      displayName: 'ClaudyGod User',
      totalPlays: 0,
      liveSubscriptions: 0,
    };
  }
}
