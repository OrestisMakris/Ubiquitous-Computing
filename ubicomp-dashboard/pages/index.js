import Head from 'next/head'
import AllDashboards from '@/components/AllDashboards'

export default function Home() {
  return (
    <>
      <Head>
        <title>UbiComp Dashboards</title>
      </Head>
      <main className="container mx-auto p-6">
        {/* this is where your tabbed dashboards live */}
        <AllDashboards />
      </main>
    </>
  )
}