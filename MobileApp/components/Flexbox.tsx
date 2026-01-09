
// components/layout/Flex.tsx
import React from 'react';
import { View, ViewProps } from 'react-native';

interface FlexProps extends ViewProps {
  children: React.ReactNode;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  className?: string;
}

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  justify = 'start',
  align = 'start',
  wrap = 'nowrap',
  className = '',
  ...props
}) => {
  const directionClass = {
    'row': 'flex-row',
    'col': 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse',
  }[direction];

  const justifyClass = {
    'start': 'justify-start',
    'end': 'justify-end',
    'center': 'justify-center',
    'between': 'justify-between',
    'around': 'justify-around',
    'evenly': 'justify-evenly',
  }[justify];

  const alignClass = {
    'start': 'items-start',
    'end': 'items-end',
    'center': 'items-center',
    'baseline': 'items-baseline',
    'stretch': 'items-stretch',
  }[align];

  const wrapClass = {
    'wrap': 'flex-wrap',
    'nowrap': 'flex-nowrap',
    'wrap-reverse': 'flex-wrap-reverse',
  }[wrap];

  return (
    <View className={`flex ${directionClass} ${justifyClass} ${alignClass} ${wrapClass} ${className}`} {...props}>
      {children}
    </View>
  );
};