
import React from 'react';

interface IconProps {
  className?: string;
}

export const GoogleDocIcon: React.FC<IconProps> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className}
        >
        <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM9 15.01L11 17L15 13.01L13.59 11.6L11 14.18L10.41 13.6L9 15.01Z" />
    </svg>
);
