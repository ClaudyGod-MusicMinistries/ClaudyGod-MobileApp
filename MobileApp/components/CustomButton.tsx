/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { CustomText } from './CustomText';

interface CustomButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: string;
  className?: string;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}) => {
  const baseStyle = `rounded-full items-center justify-center`;

  const variantStyle =
    variant === 'primary'
      ? 'bg-primary'
      : variant === 'secondary'
      ? 'bg-secondary'
      : 'border border-primary bg-transparent';

  const sizeStyle =
    size === 'sm'
      ? 'px-4 py-2'
      : size === 'lg'
      ? 'px-8 py-4'
      : 'px-6 py-3'; // default md

  const textColor =
    variant === 'outline'
      ? 'text-primary'
      : 'text-white';

  return (
    <TouchableOpacity
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className || ''}`}
      {...props}
    >
      <CustomText className={textColor}>
        {children}
      </CustomText>
    </TouchableOpacity>
  );
};
