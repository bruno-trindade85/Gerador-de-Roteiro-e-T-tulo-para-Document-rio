
import React from 'react';

interface IconProps {
  className?: string;
}

export const SaveIcon: React.FC<IconProps> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={className}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 3.75V16.5a2.25 2.25 0 0 1-2.25 2.25H9.75a2.25 2.25 0 0 1-2.25-2.25V3.75m.75 13.5 3-3m0 0 3 3m-3-3v-6m-1.5-9H5.625a1.875 1.875 0 0 0-1.875 1.875v17.25a1.875 1.875 0 0 0 1.875 1.875h12.75a1.875 1.875 0 0 0 1.875-1.875V16.5"
        />
    </svg>
);
