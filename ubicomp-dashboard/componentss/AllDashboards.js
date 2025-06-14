import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DashboardOne from '@/components/DashboardOne';

export default function AllDashboards() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white p-6 font-[SF Pro Display]">
      <Tabs defaultValue="d1">
        <TabsList className="mb-6 space-x-2">
          <TabsTrigger value="d1">📊 Snapshot Overview</TabsTrigger>
          <TabsTrigger value="d2">📈 Pattern Observer</TabsTrigger>
          <TabsTrigger value="d3">🕵️‍♂️ Big Brother</TabsTrigger>
        </TabsList>

        <TabsContent value="d1">
          <DashboardOne />
        </TabsContent>
        <TabsContent value="d2">
          {/* TODO: insert your RSSI chart component here */}
        </TabsContent>
        <TabsContent value="d3">
          {/* TODO: insert your category distribution component here */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
