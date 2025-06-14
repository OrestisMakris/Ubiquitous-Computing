// components/ui/tabs.js
import React from 'react';
import { Tab } from '@headlessui/react';

export function Tabs({ children, className = '' }) {
  return <Tab.Group>{children}</Tab.Group>;
}

export function TabsList({ children, className = '' }) {
  return (
    <Tab.List
      className={`flex space-x-1 bg-white/50 backdrop-blur-sm rounded-xl p-1 ${className}`}
    >
      {children}
    </Tab.List>
  );
}

export function TabsTrigger({ children, className = '' }) {
  return (
    <Tab
      className={({ selected }) =>
        `w-full py-2 text-sm font-medium leading-5 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ${
          selected
            ? 'bg-white shadow'
            : 'hover:bg-white/50'
        } ${className}`
      }
    >
      {children}
    </Tab>
  );
}

export function TabsContent({ children, className = '' }) {
  return (
    <Tab.Panels className={`mt-2 ${className}`}>{children}</Tab.Panels>
  );
}
