import { StyleSheet } from 'react-native';


import responsive from '../util/responsive';

const responsiveStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    paddingHorizontal: responsive.scaleWidth(16),
  },
  containerFluid: {
    flex: 1,
    paddingHorizontal: responsive.scaleWidth(8),
  },

  // Text styles with responsive font sizes
  h1: {
    fontSize: responsive.scaleFont(22),
    lineHeight: responsive.scaleHeight(29),
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  h2: {
    fontSize: responsive.scaleFont(18),
    lineHeight: responsive.scaleHeight(24),
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  h3: {
    fontSize: responsive.scaleFont(15),
    lineHeight: responsive.scaleHeight(21),
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  body: {
    fontSize: responsive.scaleFont(12.5),
    lineHeight: responsive.scaleHeight(18),
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  caption: {
    fontSize: responsive.scaleFont(10.5),
    lineHeight: responsive.scaleHeight(14.5),
    fontFamily: 'PlusJakartaSans_400Regular',
  },

  // Spacing utilities
  mt1: { marginTop: responsive.scaleHeight(4) },
  mt2: { marginTop: responsive.scaleHeight(8) },
  mt3: { marginTop: responsive.scaleHeight(16) },
  mt4: { marginTop: responsive.scaleHeight(24) },
  mt5: { marginTop: responsive.scaleHeight(32) },

  mb1: { marginBottom: responsive.scaleHeight(4) },
  mb2: { marginBottom: responsive.scaleHeight(8) },
  mb3: { marginBottom: responsive.scaleHeight(16) },
  mb4: { marginBottom: responsive.scaleHeight(24) },
  mb5: { marginBottom: responsive.scaleHeight(32) },

  p1: { padding: responsive.scaleWidth(4) },
  p2: { padding: responsive.scaleWidth(8) },
  p3: { padding: responsive.scaleWidth(16) },
  p4: { padding: responsive.scaleWidth(24) },
  p5: { padding: responsive.scaleWidth(32) },

  // Button styles
  button: {
    height: responsive.scaleHeight(48),
    borderRadius: responsive.scaleWidth(8),
    paddingHorizontal: responsive.scaleWidth(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSmall: {
    height: responsive.scaleHeight(36),
    paddingHorizontal: responsive.scaleWidth(12),
  },
  buttonLarge: {
    height: responsive.scaleHeight(56),
    paddingHorizontal: responsive.scaleWidth(24),
  },
});

export default responsiveStyles;
