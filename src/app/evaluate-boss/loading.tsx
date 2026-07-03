export default function EvaluateBossLoading() {
  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative animate-pulse">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
          <div className="h-8 bg-slate-200 rounded-md w-48"></div>
          <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-pink-50 p-8 flex flex-col items-center border-b border-pink-100">
            <div className="w-32 h-32 bg-pink-100 rounded-full mb-4"></div>
            <div className="h-8 bg-pink-200 rounded-md w-64 mb-2"></div>
            <div className="h-4 bg-pink-200 rounded-md w-48"></div>
          </div>
          
          <div className="p-8 space-y-10">
            {[1, 2, 3].map((section) => (
              <div key={section} className="space-y-6">
                <div className="h-6 bg-slate-200 rounded-md w-1/3"></div>
                <div className="grid grid-cols-1 gap-6">
                  {[1, 2].map((field) => (
                    <div key={field} className="space-y-3">
                      <div className="h-4 bg-slate-200 rounded-md w-1/4"></div>
                      <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="h-14 bg-slate-200 rounded-2xl w-full"></div>
          </div>
        </div>
      </div>
    </main>
  );
}
