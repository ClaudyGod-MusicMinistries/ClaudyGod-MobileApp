import { useColorScheme as useRNColorScheme } from 'react-native';
import { ColorScheme } from '../constants/color';


export function useColorScheme(): ColorScheme {
  const scheme = useRNColorScheme();
  return scheme || 'dark';
}