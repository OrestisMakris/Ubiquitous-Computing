import React from 'react';

export function Card({ children, ...props }) {
  return <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: 16, margin: 8 }} {...props}>{children}</div>;
}

export function CardHeader({ children, ...props }) {
  return <div style={{ fontWeight: 'extrabold', marginBottom: 8 }} {...props}>{children}</div>;
}

export function CardTitle({ children, ...props }) {
  return <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '2.5rem' }} {...props}>{children}</h2>;
}

export function CardContent({ children, ...props }) {
  return <div style={{ fontWeight: 500 , marginLeft: 40 , fontSize: '1.7rem' }} {...props}>{children}</div>;
}