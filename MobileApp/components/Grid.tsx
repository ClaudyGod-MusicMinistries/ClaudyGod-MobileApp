// components/layout/Grid.tsx
import React from 'react';
import { View, ViewProps } from 'react-native';

interface GridProps extends ViewProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 2 | 4 | 6 | 8;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = 2,
  gap = 4,
  className = '',
  ...props
}) => {

  const gapClass = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  }[gap];

  return (
    <View className={`flex flex-row flex-wrap ${gapClass} ${className}`} {...props}>
      {React.Children.map(children, (child) => (
        <View className={`w-1/${cols}`} style={{ padding: gap / 2 }}>
          {child}
        </View>
      ))}
    </View>
  );
};