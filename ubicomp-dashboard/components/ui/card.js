import React from 'react';

export function Card({ children, ...props }) {
  return <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: 16, margin: 8 }} {...props}>{children}</div>;
}

export function CardHeader({ children, ...props }) {
  return <div style={{ fontWeight: 'extrabold', marginBottom: 8 }} {...props}>{children}</div>;
}

export function CardTitle({ children, ...props }) {
  return <h2 style={{ fontWeight: 600, margin: 2, fontSize: '2.2rem' }} {...props}>{children}</h2>;
}

export function CardContent({ children, ...props }) {
  return <div {...props}>{children}</div>;
}
