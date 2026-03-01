import { useState } from 'react'
import GrowthLogList from './components/growth/GrowthLogList'
import PlotImageManager from './components/images/PlotImageManager'
import PlotList from './components/plots/PlotList'
import TreeList from './components/trees/TreeList'
import type { Plot, Tree } from './lib/database.types'

function App() {
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null)

  const handlePlotSelect = (plot: Plot) => {
    setSelectedPlot(plot)
    setSelectedTree(null)
  }

  const handleTreeSelect = (tree: Tree) => {
    setSelectedTree(tree)
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <section className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-xl border border-gray-200 bg-white p-4">
          <h1 className="text-xl font-bold text-green-800">ระบบฐานข้อมูลโครงการปลูกป่าอเนกประสงค์ในพื้นที่ คทช.</h1>
          <p className="mt-1 text-sm text-gray-600">
            เชื่อมข้อมูลผ่าน Firestore service layer (plots → trees → growth logs)
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <PlotList selectedPlotId={selectedPlot?.id ?? null} onSelectPlot={handlePlotSelect} />
          <TreeList
            plotId={selectedPlot?.id ?? null}
            selectedTreeId={selectedTree?.id ?? null}
            onSelectTree={handleTreeSelect}
          />
          <GrowthLogList treeId={selectedTree?.id ?? null} />
        </section>

        <PlotImageManager plotId={selectedPlot?.id ?? null} />
      </section>
    </main>
  )
}

export default App
