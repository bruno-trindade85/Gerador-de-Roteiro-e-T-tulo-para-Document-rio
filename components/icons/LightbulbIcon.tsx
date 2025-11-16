
import React from 'react';

interface IconProps {
  className?: string;
}

export const LightbulbIcon: React.FC<IconProps> = ({ className }) => (
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
            d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.311a7.5 7.5 0 0 1-7.5 0c.407-.923.834-1.844 1.294-2.733m10.412 0c.46.889.887 1.81 1.294 2.733a7.5 7.5 0 0 1-7.5 0m7.5-10.311a6.012 6.012 0 0 0-1.5-.189m1.5.189a6.012 6.012 0 0 1 1.5-.189m-1.5.189a6.012 6.012 0 0 0-1.5.189m-1.5.189a6.012 6.012 0 0 1-1.5-.189" 
        />
    </svg>
);
