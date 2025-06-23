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

const DashboardTwo = dynamic(() => import('@/components/DashboardTwo'), { ssr: false })
const DashboardThree = dynamic(() => import('@/components/DashboardThree'), { ssr: false })

export default function AllDashboards() {
  const [tab, setTab] = useState('d1')

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-100 to-white p-6">
      <Tabs value={tab} onValueChange={setTab}>
        {/* Logo on right, tabs on left */}
        <div className="flex items-center justify-between mb-6">
          <TabsList className="space-x-4">
            <TabsTrigger value="d1">📊 Snapshot Overview</TabsTrigger>
            <TabsTrigger value="d2">📈 Pattern Observer</TabsTrigger>
            <TabsTrigger value="d3">🕵️‍♂️ Big Brother</TabsTrigger>
          </TabsList>
          
          <Image
            src="/logo.png"
            alt="Logo"
            width={60}
            height={60}
            className="mr-50"
          />
        </div>

        <TabsContent value="d1">
          <DashboardOne />
        </TabsContent>

        <TabsContent value="d2">
          {tab === 'd2' && <DashboardTwo />}
        </TabsContent>

        <TabsContent value="d3">
          {tab === 'd3' && <DashboardThree />}
        </TabsContent>
      </Tabs>
    </div>
  )
}