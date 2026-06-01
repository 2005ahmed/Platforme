import TopLayout from "../components/TopLayout";
import FormulaireCandidat from "../components/FormulaireCandidat";
import UploadCV from "../components/UploadCV";

export default function AIAssistancePage() {
  return (
    <TopLayout step="04" title="Assistant IA">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Assistant IA</h1>
        <p className="text-slate-500 mt-1">
          Génère des lettres de motivation & gère ton CV.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <FormulaireCandidat />
        <UploadCV />
      </div>
    </TopLayout>
  );
}
