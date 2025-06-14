import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DashboardOne from '@/components/DashboardOne';

export default function AllDashboards() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white p-6 font-[SF Pro Display]">
      <Tabs defaultValue="d1">
        <TabsList className="mb-6 space-x-2">
          <TabsTrigger value="d1">?? S???e?t??t??? St??µ??t?p?</TabsTrigger>
          <TabsTrigger value="d2">?? ? ?a?at???t?? ??t?ß??</TabsTrigger>
          <TabsTrigger value="d3">?????? ? ?e????? ?de?f??</TabsTrigger>
        </TabsList>
        <TabsContent value="d1"><DashboardOne /></TabsContent>
      </Tabs>
    </div>
  );
}
