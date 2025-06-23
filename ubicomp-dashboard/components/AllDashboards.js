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
        {/* Logo and tabs centered together */}
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/logo.png"
            alt="Logo"
            width={100}
            height={100}
            className="mb-4"
          />
          <TabsList className="space-x-4">
            <TabsTrigger value="d1">📊 Snapshot Overview</TabsTrigger>
            <TabsTrigger value="d2">📈 Pattern Observer</TabsTrigger>
            <TabsTrigger value="d3">🕵️‍♂️ Big Brother</TabsTrigger>
          </TabsList>
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