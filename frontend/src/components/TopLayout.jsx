import TopNavbar from "./TopNavbar";

export default function TopLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-5">
      </div>

      <TopNavbar />

      <main className="max-w-6xl mx-auto p-4">
        {children}
      </main>
    </div>
  );
}