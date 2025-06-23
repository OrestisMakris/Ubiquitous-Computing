import Head from 'next/head'
import AllDashboards from '@/components/AllDashboards'

export default function Home() {
  return (
    <>

      <Head>
        <title>UbiComp Dashboards</title>
        <link rel="icon" href="/logo.png" />
      </Head>
      <main className="container mx-auto p-6">
        {/**/}
        <AllDashboards />
      </main>
    </>
  )
}