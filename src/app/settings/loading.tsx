export default function SettingsLoading() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center animate-pulse">
      <div className="w-full max-w-4xl relative">
        <div className="absolute -top-4 left-0 md:-left-12 w-10 h-10 bg-slate-200 rounded-full"></div>
        
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
          <div className="text-center mb-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-200 rounded-full mb-4"></div>
            <div className="h-8 bg-slate-200 rounded-md w-64 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded-md w-48"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-8 flex flex-col items-center h-48">
                <div className="w-16 h-16 bg-slate-200 rounded-full mb-4"></div>
                <div className="h-6 bg-slate-200 rounded-md w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded-md w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
