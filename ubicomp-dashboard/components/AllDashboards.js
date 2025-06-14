import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import DashboardOne from '@/components/DashboardOne'

// client-only import of DashboardTwo
const DashboardTwo = dynamic(() => import('@/components/DashboardTwo'), {
  ssr: false,
})

export default function AllDashboards() {
  const [tab, setTab] = useState('d1')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white p-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6 space-x-2">
          <TabsTrigger value="d1">📊 Snapshot Overview</TabsTrigger>
          <TabsTrigger value="d2">📈 Pattern Observer</TabsTrigger>
          <TabsTrigger value="d3">🕵️‍♂️ Big Brother</TabsTrigger>
        </TabsList>

        {/* Tab 1 */}
        <TabsContent value="d1">
          <DashboardOne />
        </TabsContent>

        {/* Tab 2: only mount when active */}
        <TabsContent value="d2">
          {tab === 'd2' && <DashboardTwo />}
        </TabsContent>

        {/* Tab 3 */}
        <TabsContent value="d3">
          {/* TODO: insert your category distribution component here */}
        </TabsContent>
      </Tabs>
    </div>
  )
}