import TopLayout from "../components/TopLayout";
import FormulaireCandidat from "../components/FormulaireCandidat";

export default function AIAssistancePage() {
  return (
    <TopLayout step="04" title="Assistant IA">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
        <h1 className="text-xl font-bold text-slate-900">Assistant IA</h1>
        <p className="text-slate-500 mt-1">
          Génère des lettres de motivation & gère ton CV.
        </p>
      </div>

      {/* FormulaireCandidat complet — fih form + AI cards */}
      <FormulaireCandidat />
    </TopLayout>
  );
}