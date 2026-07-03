export default function KanbanLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
          <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
          <div className="space-y-3 flex-1">
            <div className="h-8 bg-slate-200 rounded-md w-48"></div>
            <div className="h-4 bg-slate-200 rounded-md w-32"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((col) => (
            <div key={col} className="bg-slate-100 rounded-2xl p-4 flex flex-col gap-4 min-h-[500px]">
              <div className="h-6 bg-slate-200 rounded-md w-1/2 mx-auto mb-4"></div>
              {[1, 2, 3].map((card) => (
                <div key={card} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 h-32">
                  <div className="h-5 bg-slate-200 rounded-md w-3/4 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-full mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-5/6"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
