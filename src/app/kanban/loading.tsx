export default function Loading() {
  return (
    <div className="animate-pulse flex flex-col h-full gap-8 mt-6">
      {/* Dashboard Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-200/50 rounded-2xl h-32 w-full border border-slate-100"></div>
        ))}
      </div>
      
      {/* Columns Skeleton */}
      <div className="overflow-hidden w-full">
        <div className="flex gap-6 h-[600px]">
          {[1, 2, 3].map((col) => (
            <div key={col} className="bg-slate-100/60 rounded-2xl w-80 h-full p-4 border border-slate-200/50 flex flex-col shrink-0">
              <div className="h-6 w-32 bg-slate-200 rounded-md mb-6 mt-2 mx-2"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((card) => (
                  <div key={card} className="bg-white/50 rounded-xl h-40 w-full border border-slate-200/50"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
