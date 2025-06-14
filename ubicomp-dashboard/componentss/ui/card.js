// components/ui/card.js
import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white/80 backdrop-blur-md rounded-2xl shadow p-4 transition hover:shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`mb-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3
      className={`text-lg font-medium text-gray-900 ${className}`}
      style={{ fontFamily: 'SF Pro Display' }}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}