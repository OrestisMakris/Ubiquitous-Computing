import React from 'react';

export function Card({ children, ...props }) {
  return <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: 16, margin: 8 }} {...props}>{children}</div>;
}

export function CardHeader({ children, ...props }) {
  return <div style={{ fontWeight: 'extrabold', marginBottom: 8 }} {...props}>{children}</div>;
}

export function CardTitle({ children, ...props }) {
  return <h2 style={{ margin: 0, fontSize: '4rem' }} {...props}>{children}</h2>;
}

export function CardContent({ children, ...props }) {
  return <div {...props}>{children}</div>;
}
