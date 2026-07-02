// styles/commonStyles.ts
// Static layout utilities — pure structural styles with no theme dependency.
// Import these for layout composition; use makeStyles() for any theme color or spacing.
import { StyleSheet } from 'react-native';

export const common = StyleSheet.create({
  // ── Flex primitives ──────────────────────────────────────────────────────────
  flex1:          { flex: 1 },
  row:            { flexDirection: 'row' },
  rowCenter:      { flexDirection: 'row', alignItems: 'center' },
  rowBetween:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowEnd:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  center:         { alignItems: 'center', justifyContent: 'center' },
  centerH:        { alignItems: 'center' },
  centerV:        { justifyContent: 'center' },
  selfCenter:     { alignSelf: 'center' },
  selfStart:      { alignSelf: 'flex-start' },
  selfEnd:        { alignSelf: 'flex-end' },
  selfStretch:    { alignSelf: 'stretch' },

  // ── Positioning ──────────────────────────────────────────────────────────────
  absolute:       { position: 'absolute' },
  fill:           { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  fillCenter:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },

  // ── Overflow ─────────────────────────────────────────────────────────────────
  hidden:         { overflow: 'hidden' },
  visible:        { overflow: 'visible' },

  // ── Image sizing ─────────────────────────────────────────────────────────────
  imgFill:        { width: '100%', height: '100%' },
  imgCover:       { width: '100%', height: '100%', resizeMode: 'cover' },
  imgContain:     { width: '100%', height: '100%', resizeMode: 'contain' },

  // ── Common shapes ────────────────────────────────────────────────────────────
  circle:         { borderRadius: 999 },
  divider:        { height: 1 },
  dividerV:       { width: 1 },

  // ── Interaction ──────────────────────────────────────────────────────────────
  pressable:      { activeOpacity: 0.8 } as never,
});

// Shorthand for StyleSheet.absoluteFillObject — avoids importing StyleSheet just for this.
export const fillAbsolute = StyleSheet.absoluteFillObject;
