import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
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

const DashboardThree = dynamic(() => import('@/components/DashboardThree'), {
  ssr: false,
})
export default function AllDashboards() {
  const [tab, setTab] = useState('d1')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white p-6">
<Tabs value={tab} onValueChange={setTab}>
  <div className="flex flex-row flex-nowrap items-center gap-4 mb-6">
    <Image src="/logo.png" alt="Logo" width={32} height={32} />

    {/* make sure this is also a row, not a column */}
    <TabsList className="flex flex-row flex-nowrap items-center gap-2">
      <TabsTrigger value="d1">📊 Snapshot Overview</TabsTrigger>
      <TabsTrigger value="d2">📈 Pattern Observer</TabsTrigger>
      <TabsTrigger value="d3">🕵️‍♂️ Big Brother</TabsTrigger>
    </TabsList>
  </div>

  <TabsContent value="d1">
    <DashboardOne />
  </TabsContent>
  …

        {/* Tab 2: only mount when active */}
        <TabsContent value="d2">
          {tab === 'd2' && <DashboardTwo />}
        </TabsContent>

        {/* Tab 3 */}
        <TabsContent value="d3">
          {tab === 'd3' && <DashboardThree />}
        </TabsContent>
      </Tabs>
    </div>
  )
}