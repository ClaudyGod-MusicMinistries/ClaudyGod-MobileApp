/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactNode } from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { CustomText } from './CustomText';

interface CustomButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode; // Changed from string to ReactNode
  className?: string;
  textStyle?: any;
  textClassName?: string;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  textStyle,
  textClassName,
  ...props
}) => {
  const baseStyle = `items-center justify-center`;

  const variantStyle =
    variant === 'primary'
      ? 'bg-primary rounded-full'
      : variant === 'secondary'
      ? 'bg-secondary rounded-full'
      : variant === 'outline'
      ? 'border border-primary bg-transparent rounded-full'
      : 'bg-transparent';

  const sizeStyle =
    size === 'sm'
      ? variant === 'text' ? 'px-2 py-1' : 'px-4 py-2'
      : size === 'lg'
      ? variant === 'text' ? 'px-4 py-2' : 'px-8 py-4'
      : variant === 'text' ? 'px-3 py-1' : 'px-6 py-3';

  // Only wrap with CustomText if children is a string
  const renderContent = () => {
    if (typeof children === 'string') {
      return (
        <CustomText 
          className={`${textColor} ${textClassName || ''}`}
          style={textStyle}
          variant={size === 'sm' ? 'caption' : 'body'}
        >
          {children}
        </CustomText>
      );
    }
    return children;
  };

  const textColor =
    variant === 'outline'
      ? 'text-primary'
      : variant === 'text'
      ? 'text-primary'
      : 'text-white';

  return (
    <TouchableOpacity
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className || ''}`}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};