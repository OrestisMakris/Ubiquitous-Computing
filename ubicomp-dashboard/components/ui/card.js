import React from 'react';

// A simple utility to combine classNames, letting you override defaults.
const cn = (...classes) => classes.filter(Boolean).join(' ');

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  // The hardcoded inline style is now gone. It uses Tailwind classes.
  return (
    <h2 className={cn('text-xl font-semibold leading-none tracking-tight', className)} {...props}>
      {children}
    </h2>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-4 pt-0', className)} {...props}>
      {children}
    </div>
  );
}