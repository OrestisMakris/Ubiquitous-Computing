// filepath: c:\Users\orest\OneDrive - University of Patras\Documents\GitHub\Ubiquitous-Computing\ubicomp-dashboard\componentss\ui\card.js
import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-5 m-1 transition-all duration-300 ease-in-out hover:shadow-xl ${className}`}
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