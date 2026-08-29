import { describe, expect, it } from 'vitest';

import {
  activeOrder,
  addToQueue,
  advance,
  createQueue,
  currentContextItem,
  cycleRepeat,
  jumpTo,
  peekNext,
  playFrom,
  playNext,
  previous,
  removeFromUserQueue,
  reorderUserQueue,
  setRepeat,
  setShuffle,
  toggleShuffle,
} from './queue';
import { HISTORY_LIMIT, type PlaybackItem, type QueueOrigin, type Rng } from './types';

// ─── fixtures ─────────────────────────────────────────────────────────────────

const item = (id: string): PlaybackItem => ({
  id,
  title: `Track ${id}`,
  source: { kind: 'stream', uri: `https://cdn.example/${id}.m3u8` },
});

const ITEMS = ['a', 'b', 'c', 'd', 'e'].map(item);
const ORIGIN: QueueOrigin = { kind: 'playlist', id: 'pl_1', label: 'Worship Essentials' };

/** Deterministic RNG: always returns 0, so Fisher–Yates reverses `rest`. */
const zeroRng: Rng = () => 0;

const start = (startId = 'a', shuffle = false, rng: Rng = Math.random) =>
  playFrom({ ...createQueue(), shuffle }, { origin: ORIGIN, items: ITEMS, startId }, rng);

const ids = (list: PlaybackItem[]) => list.map((i) => i.id);

// ─── starting playback ────────────────────────────────────────────────────────

describe('playFrom', () => {
  it('starts on the requested track in natural order', () => {
    const q = start('c');
    expect(q.nowPlaying?.id).toBe('c');
    expect(q.nowPlayingSource).toBe('context');
    expect(q.contextCursor).toBe(2);
    expect(q.shuffleOrder).toBeNull();
    expect(q.origin.label).toBe('Worship Essentials');
  });

  it('falls back to the first track when startId is unknown or missing', () => {
    expect(start('zzz').nowPlaying?.id).toBe('a');
    expect(playFrom(createQueue(), { origin: ORIGIN, items: ITEMS }).nowPlaying?.id).toBe('a');
  });

  it('clears a previous user queue', () => {
    let q = start('a');
    q = addToQueue(q, item('x'));
    q = playFrom(q, { origin: ORIGIN, items: ITEMS, startId: 'b' });
    expect(q.userQueue).toHaveLength(0);
  });

  it('handles an empty item list', () => {
    const q = playFrom(createQueue(), { origin: ORIGIN, items: [] });
    expect(q.nowPlaying).toBeNull();
    expect(q.contextCursor).toBe(-1);
    expect(peekNext(q)).toBeNull();
    expect(advance(q).ended).toBe(true);
  });

  it('pins the start track at position 0 when starting shuffled', () => {
    const q = start('c', true, zeroRng);
    expect(q.contextCursor).toBe(0);
    expect(q.shuffleOrder?.[0]).toBe(2); // natural index of 'c'
    expect(q.nowPlaying?.id).toBe('c');
    expect([...(q.shuffleOrder ?? [])].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});

// ─── linear advance ───────────────────────────────────────────────────────────

describe('advance — context', () => {
  it('walks forward through the context', () => {
    let q = start('a');
    const seen = [q.nowPlaying!.id];
    for (let n = 0; n < 4; n += 1) {
      const r = advance(q, 'user');
      q = r.state;
      expect(r.ended).toBe(false);
      seen.push(q.nowPlaying!.id);
    }
    expect(seen).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('stops at the end with repeat off', () => {
    let q = start('d');
    q = advance(q).state; // -> e
    const r = advance(q); // past end
    expect(r.ended).toBe(true);
    expect(r.state.nowPlaying?.id).toBe('e'); // unchanged
  });

  it('wraps to the start with repeat: context', () => {
    let q = setRepeat(start('d'), 'context');
    q = advance(q).state; // e
    const r = advance(q); // wrap
    expect(r.ended).toBe(false);
    expect(r.state.nowPlaying?.id).toBe('a');
    expect(r.state.contextCursor).toBe(0);
  });

  it('pushes the outgoing track onto history', () => {
    let q = start('a');
    q = advance(q).state;
    q = advance(q).state;
    expect(ids(q.history)).toEqual(['a', 'b']);
  });
});

// ─── repeat one ───────────────────────────────────────────────────────────────

describe('repeat: one', () => {
  it('holds the current track on auto-advance and reports looped', () => {
    const q = setRepeat(start('b'), 'one');
    const r = advance(q, 'auto');
    expect(r.looped).toBe(true);
    expect(r.ended).toBe(false);
    expect(r.state.nowPlaying?.id).toBe('b');
    expect(r.state.history).toHaveLength(0);
  });

  it('is overridden by an explicit user skip', () => {
    const q = setRepeat(start('b'), 'one');
    const r = advance(q, 'user');
    expect(r.looped).toBe(false);
    expect(r.state.nowPlaying?.id).toBe('c');
  });

  it('peekNext returns the same track for auto, the next for user', () => {
    const q = setRepeat(start('b'), 'one');
    expect(peekNext(q, 'auto')?.id).toBe('b');
    expect(peekNext(q, 'user')?.id).toBe('c');
  });
});

// ─── user queue ───────────────────────────────────────────────────────────────

describe('user queue', () => {
  it('play-next is consumed before the context resumes', () => {
    let q = start('a');
    q = playNext(q, item('x'));
    q = playNext(q, item('y')); // y jumps ahead of x
    expect(ids(q.userQueue)).toEqual(['y', 'x']);

    q = advance(q).state;
    expect(q.nowPlaying?.id).toBe('y');
    expect(q.nowPlayingSource).toBe('user');
    q = advance(q).state;
    expect(q.nowPlaying?.id).toBe('x');
    q = advance(q).state;
    expect(q.nowPlaying?.id).toBe('b'); // context resumes where it left off
    expect(q.contextCursor).toBe(1);
  });

  it('add-to-queue appends after existing user items', () => {
    let q = start('a');
    q = playNext(q, item('x'));
    q = addToQueue(q, item('z'));
    expect(ids(q.userQueue)).toEqual(['x', 'z']);
  });

  it('dedupes by id (re-queuing moves the item)', () => {
    let q = start('a');
    q = addToQueue(q, item('x'));
    q = addToQueue(q, item('z'));
    q = playNext(q, item('z')); // moves z to front
    expect(ids(q.userQueue)).toEqual(['z', 'x']);
  });

  it('remove and reorder', () => {
    let q = start('a');
    q = addToQueue(q, item('x'));
    q = addToQueue(q, item('y'));
    q = addToQueue(q, item('z'));
    q = removeFromUserQueue(q, 'y');
    expect(ids(q.userQueue)).toEqual(['x', 'z']);
    q = reorderUserQueue(q, 0, 1);
    expect(ids(q.userQueue)).toEqual(['z', 'x']);
    expect(reorderUserQueue(q, 5, 0)).toBe(q); // out of range is a no-op
  });

  it('does not advance the context cursor while user tracks play', () => {
    let q = start('a');
    q = addToQueue(q, item('x'));
    const cursorBefore = q.contextCursor;
    q = advance(q).state;
    expect(q.contextCursor).toBe(cursorBefore);
  });
});

// ─── previous ─────────────────────────────────────────────────────────────────

describe('previous', () => {
  it('does nothing (changed:false) with no history', () => {
    const r = previous(start('a'));
    expect(r.changed).toBe(false);
  });

  it('walks back through history and rewinds the context cursor', () => {
    let q = start('a');
    q = advance(q).state; // b
    q = advance(q).state; // c
    expect(q.contextCursor).toBe(2);

    const r = previous(q);
    expect(r.changed).toBe(true);
    expect(r.state.nowPlaying?.id).toBe('b');
    expect(r.state.nowPlayingSource).toBe('context');
    expect(r.state.contextCursor).toBe(1);
    expect(ids(r.state.history)).toEqual(['a']);
  });

  it('steps back onto a user-queued track without moving the context cursor', () => {
    let q = start('a');
    q = playNext(q, item('x'));
    q = advance(q).state; // x (user)
    q = advance(q).state; // b (context)
    const r = previous(q);
    expect(r.state.nowPlaying?.id).toBe('x');
    expect(r.state.nowPlayingSource).toBe('user');
  });
});

// ─── jumpTo ───────────────────────────────────────────────────────────────────

describe('jumpTo', () => {
  it('jumps to a context track by id', () => {
    let q = start('a');
    q = jumpTo(q, 'd');
    expect(q.nowPlaying?.id).toBe('d');
    expect(q.contextCursor).toBe(3);
    expect(ids(q.history)).toEqual(['a']);
  });

  it('jumps to a user-queue track and drops the ones above it', () => {
    let q = start('a');
    q = addToQueue(q, item('x'));
    q = addToQueue(q, item('y'));
    q = addToQueue(q, item('z'));
    q = jumpTo(q, 'y');
    expect(q.nowPlaying?.id).toBe('y');
    expect(ids(q.userQueue)).toEqual(['z']);
  });

  it('is a no-op for an unknown id', () => {
    const q = start('a');
    expect(jumpTo(q, 'nope')).toBe(q);
  });
});

// ─── shuffle ──────────────────────────────────────────────────────────────────

describe('shuffle', () => {
  it('keeps the current track playing when toggled on', () => {
    let q = start('c');
    q = toggleShuffle(q, zeroRng);
    expect(q.shuffle).toBe(true);
    expect(q.nowPlaying?.id).toBe('c'); // unchanged
    expect(currentContextItem(q)?.id).toBe('c');
    expect(q.contextCursor).toBe(0);
    expect([...q.shuffleOrder!].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });

  it('restores natural order and re-derives the cursor when toggled off', () => {
    let q = start('a', true, zeroRng); // shuffled from the start, 'a' pinned
    q = advance(q).state; // some shuffled track
    const playingId = q.nowPlaying!.id;
    q = setShuffle(q, false);
    expect(q.shuffleOrder).toBeNull();
    expect(q.nowPlaying?.id).toBe(playingId); // still the same track
    expect(q.contextItems[q.contextCursor].id).toBe(playingId); // cursor points at it
  });

  it('advances through every context track exactly once before ending', () => {
    let q = start('a', true, zeroRng);
    const seen = new Set([q.nowPlaying!.id]);
    for (;;) {
      const r = advance(q, 'user');
      if (r.ended) break;
      q = r.state;
      seen.add(q.nowPlaying!.id);
    }
    expect(seen).toEqual(new Set(['a', 'b', 'c', 'd', 'e']));
  });

  it('toggling twice is a no-op for ordering identity but not object identity', () => {
    const q = start('a');
    expect(setShuffle(q, false)).toBe(q); // already off
  });
});

// ─── repeat cycling ───────────────────────────────────────────────────────────

describe('cycleRepeat', () => {
  it('cycles off -> context -> one -> off', () => {
    let q = start('a');
    expect(q.repeat).toBe('off');
    q = cycleRepeat(q);
    expect(q.repeat).toBe('context');
    q = cycleRepeat(q);
    expect(q.repeat).toBe('one');
    q = cycleRepeat(q);
    expect(q.repeat).toBe('off');
  });
});

// ─── history cap ──────────────────────────────────────────────────────────────

describe('history cap', () => {
  it(`never grows past ${HISTORY_LIMIT} and keeps the most recent entries`, () => {
    const many = Array.from({ length: 150 }, (_, i) => item(`t${i}`));
    let q = playFrom(setRepeat(createQueue(), 'context'), { origin: ORIGIN, items: many, startId: 't0' });
    for (let n = 0; n < 400; n += 1) q = advance(q, 'user').state;
    // 400 linear advances from t0 over 150 items (repeat: context) -> now on t100
    expect(q.nowPlaying?.id).toBe('t100');
    expect(q.history.length).toBe(HISTORY_LIMIT);
    expect(q.history.at(-1)?.id).toBe('t99');
    expect(q.history[0]?.id).toBe(`t${100 - HISTORY_LIMIT}`);
  });
});

// ─── peekNext parity ──────────────────────────────────────────────────────────

describe('peekNext matches advance', () => {
  const scenarios: [string, () => ReturnType<typeof createQueue>][] = [
    ['linear mid-context', () => start('b')],
    ['end, repeat off', () => advance(start('d')).state],
    ['end, repeat context', () => setRepeat(advance(start('d')).state, 'context')],
    ['with user queue', () => addToQueue(start('a'), item('x'))],
    ['shuffled', () => start('a', true, zeroRng)],
  ];

  it.each(scenarios)('%s', (_label, build) => {
    const q = build();
    const peeked = peekNext(q, 'user');
    const advanced = advance(q, 'user');
    if (advanced.ended) {
      expect(peeked).toBeNull();
    } else {
      expect(peeked?.id).toBe(advanced.state.nowPlaying?.id);
    }
  });
});

// ─── purity ───────────────────────────────────────────────────────────────────

describe('purity', () => {
  it('never mutates the input state', () => {
    const q = start('a');
    const snapshot = JSON.stringify(q);
    advance(q);
    playNext(q, item('x'));
    toggleShuffle(q, zeroRng);
    previous(q);
    setRepeat(q, 'one');
    expect(JSON.stringify(q)).toBe(snapshot);
  });

  it('activeOrder reflects shuffle state', () => {
    expect(activeOrder(start('a'))).toEqual([0, 1, 2, 3, 4]);
    expect(activeOrder(start('a', true, zeroRng))).not.toEqual([0, 1, 2, 3, 4]);
  });
});
