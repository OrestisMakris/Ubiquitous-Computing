import React, { createContext, useContext } from 'react'

const TabsContext = createContext({
  value: null,
  onChange: (_) => {}, // Corrected: removed type annotation
})

export function Tabs({ value, onValueChange, children }) { // Corrected: removed type annotations
  return (
    <TabsContext.Provider value={{ value, onChange: onValueChange }}>
      <div>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children }) { // Corrected: removed type annotation
  return <div className="flex space-x-2">{children}</div>
}

export function TabsTrigger({ value, children }) { // Corrected: removed type annotations
  const { onChange, value: active } = useContext(TabsContext)
  const isActive = active === value
  return (
    <button
      onClick={() => onChange(value)}
      className={
        'px-4 py-2 rounded ' +
        (isActive
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
      }
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children }) { // Corrected: removed type annotations
  const { value: active } = useContext(TabsContext)
  if (active !== value) return null
  return <div>{children}</div>
}