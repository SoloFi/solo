import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="w-full h-full">
      <h1 className="text-3xl font-bold">My Assets</h1>
    </div>
  )
}
