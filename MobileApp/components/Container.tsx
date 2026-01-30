// components/layout/Container.tsx
import React from 'react';
import { View, ViewProps } from 'react-native';

interface ContainerProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ children, className = '', ...props }) => {
  return (
    <View className={`px-4 ${className}`} {...props}>
      {children}
    </View>
  );
};
