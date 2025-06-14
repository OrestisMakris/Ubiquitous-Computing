// filepath: c:\Users\orest\OneDrive - University of Patras\Documents\GitHub\Ubiquitous-Computing\ubicomp-dashboard\componentss\ui\tabs.js
import React from 'react'; // Removed useState as active tab logic should be managed by parent

export function Tabs({ children, className = '' }) {
  return <div className={`font-sans ${className}`}>{children}</div>;
}

export function TabsList({ children, className = '' }) {
  return (
    <div
      className={`flex space-x-1 bg-slate-200/60 backdrop-blur-sm rounded-lg p-1 ${className}`}
    >
      {children}
    </div>
  );
}

// 'isActive' and 'onClick' should be provided by the parent component that manages tab state.
export function TabsTrigger({ children, onClick, isActive, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium leading-5 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 transition-all duration-150 ease-in-out
        ${isActive
          ? 'bg-white shadow text-sky-700'
          : 'text-slate-600 hover:bg-white/70 hover:text-slate-800'
        }
        ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, className = '' }) {
  // Ensure this content is only shown when its corresponding tab is active (logic in parent)
  return <div className={`mt-3 p-1 ${className}`}>{children}</div>;
}