// components/ui/tabs.js
import React from 'react';
import { Tab } from '@headlessui/react';

export function Tabs({ children, className = '' }) {
  return <Tab.Group>{children}</Tab.Group>;
}

export function TabsList({ children, className = '' }) {
  return (
    <Tab.List
      className={`flex space-x-2 bg-white/50 backdrop-blur-sm rounded-xl p-2 ${className}`}
    >
      {children}
    </Tab.List>
  );
}

export function TabsTrigger({ children, className = '' }) {
  return (
    <Tab
      className={({ selected }) =>
        `flex-1 py-2 text-base font-medium leading-5 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ${{
          true: 'bg-white shadow-md',
          false: 'hover:bg-white/50'
        }[selected]} ${className}`
      }
    >
      {children}
    </Tab>
  );
}

export function TabsContent({ children, className = '' }) {
  return (
    <Tab.Panels className={`mt-4 ${className}`}>{children}</Tab.Panels>
  );
}
