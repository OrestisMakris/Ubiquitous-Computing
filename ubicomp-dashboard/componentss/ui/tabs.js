import React from 'react';

export function Tabs({ children }) {
  return <div>{children}</div>;
}

export function TabsList({ children }) {
  return <div>{children}</div>;
}

export function TabsTrigger({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}

export function TabsContent({ children }) {
  return <div>{children}</div>;
}