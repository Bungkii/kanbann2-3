export default function ElectionLoading() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center animate-pulse">
      <div className="w-full max-w-5xl">
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="w-16 h-16 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-10 bg-slate-200 rounded-md w-64 mb-3"></div>
          <div className="h-5 bg-slate-200 rounded-md w-48 mb-8"></div>
          <div className="h-24 bg-slate-200 rounded-2xl w-full max-w-2xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-[2rem] p-8 border border-slate-100 flex flex-col items-center">
              <div className="w-32 h-32 bg-slate-200 rounded-full mb-6"></div>
              <div className="h-8 bg-slate-200 rounded-md w-3/4 mb-3"></div>
              <div className="h-4 bg-slate-200 rounded-md w-1/2 mb-8"></div>
              <div className="h-12 bg-slate-200 rounded-full w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
