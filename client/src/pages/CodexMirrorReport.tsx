import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ArrowLeft, Flame, Lock, Sparkles } from "lucide-react";

export default function CodexMirrorReport() {
  const [, setLocation] = useLocation();
  const reportQuery = trpc.codex.client.mirrorReport.useQuery();

  if (reportQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-50 to-purple-50/30">
        <Flame className="w-10 h-10 text-purple-400 animate-pulse" />
      </div>
    );
  }

  const report = reportQuery.data;

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-50 to-purple-50/30">
        <div className="text-center space-y-4">
          <Lock className="w-12 h-12 text-stone-300 mx-auto" />
          <h2 className="text-xl font-semibold">Your Mirror Report is not yet available</h2>
          <p className="text-muted-foreground text-sm">Complete your assessment and wait for April to review and release your report.</p>
          <Button variant="outline" onClick={() => setLocation("/account/codex")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Portal
          </Button>
        </div>
      </div>
    );
  }

  const content = report.contentJson as any;
  const archetypes = content?.archetypeConstellation || [];
  const wounds = content?.activeWounds || [];
  const mirrors = content?.activeMirrors || [];
  const spectrum = content?.spectrumProfile || {};
  const integrationIndex = content?.integrationIndex || 0;
  const contradictions = content?.contradictionFlags || [];

  const spectrumBarColors = { shadow: "bg-red-400", threshold: "bg-amber-400", gift: "bg-emerald-400" };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-purple-50/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/account/codex")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Portal
          </Button>
        </div>

        {/* Header */}
        <div className="text-center py-6">
          <Eye className="w-14 h-14 text-purple-500 mx-auto mb-3" />
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Your Mirror Report</h1>
          <p className="text-muted-foreground mt-2 italic">What the Codex sees when it looks at you</p>
        </div>

        {/* April's Note */}
        {report.aprilNote && (
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-purple-900">A Note from April</h3>
              </div>
              <p className="text-sm leading-relaxed text-purple-800 whitespace-pre-wrap">{report.aprilNote}</p>
            </CardContent>
          </Card>
        )}

        {/* Spectrum Profile */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Spectrum Profile</h3>
            <div className="space-y-3">
              {[
                { label: "Shadow", pct: spectrum.shadowPct, color: spectrumBarColors.shadow },
                { label: "Threshold", pct: spectrum.thresholdPct, color: spectrumBarColors.threshold },
                { label: "Gift", pct: spectrum.giftPct, color: spectrumBarColors.gift },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{s.label}</span>
                    <span className="font-medium">{s.pct || 0}%</span>
                  </div>
                  <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${s.pct || 0}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">Total scored responses: {spectrum.totalScored || 0}</p>
            </div>
          </CardContent>
        </Card>

        {/* Archetype Constellation */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Your Archetype Constellation</h3>
            <div className="space-y-4">
              {archetypes.map((a: any, i: number) => (
                <div key={a.archetype} className={`p-4 rounded-lg ${i === 0 ? "bg-amber-50 border border-amber-200" : "bg-stone-50 border border-stone-200"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {i === 0 && <Flame className="w-4 h-4 text-amber-500" />}
                      <span className="font-semibold">{a.archetype}</span>
                    </div>
                    <Badge variant="outline">{a.weightedScore} pts</Badge>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-red-600">Shadow: {a.spectrumDistribution?.shadow || 0}</span>
                    <span className="text-amber-600">Threshold: {a.spectrumDistribution?.threshold || 0}</span>
                    <span className="text-emerald-600">Gift: {a.spectrumDistribution?.gift || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Sections: {(a.sections || []).join(", ")}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Wounds */}
        {wounds.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Active Wound Imprints</h3>
              <div className="space-y-3">
                {wounds.map((w: any) => (
                  <div key={w.wiCode} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-medium text-red-800">{w.wiCode}</span>
                      <Badge className="bg-red-100 text-red-700">{w.weightedScore} pts</Badge>
                    </div>
                    <p className="text-xs text-red-600 mt-1">Frequency: {w.frequency} | Sections: {(w.sections || []).join(", ")}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Mirrors */}
        {mirrors.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Active Mirror Patterns</h3>
              <div className="space-y-3">
                {mirrors.map((m: any) => (
                  <div key={m.mpCode} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-medium text-blue-800">{m.mpCode}</span>
                      <Badge className="bg-blue-100 text-blue-700">{m.weightedScore} pts</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Integration Index */}
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-2">Integration Index</h3>
            <p className="text-4xl font-bold text-amber-600">{integrationIndex}</p>
            <p className="text-xs text-muted-foreground mt-1">Higher values indicate stronger truth-integrity activation relative to wound patterns</p>
          </CardContent>
        </Card>

        {/* Contradiction Flags */}
        {contradictions.length > 0 && (
          <Card className="border-amber-200">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 text-amber-700">Contradiction Flags</h3>
              {contradictions.map((c: any, i: number) => (
                <div key={i} className="p-3 bg-amber-50 rounded-lg mb-2">
                  <p className="text-sm font-medium">{c.pattern}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.interpretation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
