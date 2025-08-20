import Header from '../components/Hearder'
import BoardsPanel from '../components/BoardPanel'
import React from 'react'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-2">Mes boards</h2>
          <BoardsPanel />
        </section>
      </main>
    </div>
  )
}
