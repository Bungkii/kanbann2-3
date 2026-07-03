export default function SummariesLoading() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center animate-pulse">
      <div className="w-full max-w-5xl">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
          <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
          <div className="space-y-3">
            <div className="h-8 bg-slate-200 rounded-md w-64"></div>
            <div className="h-4 bg-slate-200 rounded-md w-48"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 h-48 flex flex-col justify-between">
              <div>
                <div className="h-6 bg-slate-200 rounded-md w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded-md w-1/2"></div>
              </div>
              <div className="h-10 bg-slate-200 rounded-full w-full mt-4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
