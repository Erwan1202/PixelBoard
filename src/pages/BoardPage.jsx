import { useParams } from 'react-router-dom'
import React from 'react'


export default function BoardPage() {
  const { id } = useParams()
  return (
    <div className="min-h-screen p-6">
      <a href="/" className="underline text-sm">← Retour</a>
      <h1 className="text-2xl font-bold mt-2">Board {id}</h1>
      <div className="mt-4 text-gray-600">Canvas arrive à l’étape suivante 😉</div>
    </div>
  )
}
