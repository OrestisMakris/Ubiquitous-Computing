// filepath: c:\Users\orest\OneDrive - University of Patras\Documents\GitHub\Ubiquitous-Computing\ubicomp-dashboard\componentss\ui\card.js
import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`
        bg-white/20 backdrop-blur-lg rounded-2xl
        shadow-[0_10px_25px_rgba(0,0,0,0.1),_0_4px_10px_rgba(0,0,0,0.05)]
        hover:shadow-[0_15px_35px_rgba(0,0,0,0.15),_0_5px_15px_rgba(0,0,0,0.07)]
        transition-shadow duration-300 ease-out
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`pb-3 mb-3 border-b border-gray-200/80 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h2
      className={`text-lg font-semibold text-gray-800 ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`text-gray-700 ${className}`} {...props}>
      {children}
    </div>
  );
}