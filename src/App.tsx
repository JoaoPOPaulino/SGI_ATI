import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center max-w-md">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-4">
          🚀 SGI-ATI Online
        </h1>
        <p className="text-slate-400 text-lg mb-6">
          Ambiente configurado com sucesso. Pronto para iniciar o desenvolvimento do inventário unificado. [cite: 2]
        </p>
        <div className="flex gap-4 justify-center">
          <span className="px-3 py-1 bg-slate-700 rounded-full text-xs font-mono text-blue-300 border border-blue-500/30">React + TS</span>
          <span className="px-3 py-1 bg-slate-700 rounded-full text-xs font-mono text-emerald-300 border border-emerald-500/30">Tailwind v4</span>
        </div>
      </div>
    </div>
  )
}

export default App