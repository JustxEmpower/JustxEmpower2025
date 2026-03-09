import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollText, ArrowLeft, ArrowRight, Save, CheckCircle2, Loader2, Flame } from "lucide-react";

export default function CodexScroll() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/account/codex/scroll/:moduleNum");
  const moduleNum = parseInt(params?.moduleNum || "1", 10);

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const constantsQuery = trpc.codex.client.constants.useQuery();
  const entriesQuery = trpc.codex.client.scrollEntries.useQuery({ moduleNum });
  const saveMutation = trpc.codex.client.saveScrollResponse.useMutation();

  const scrollModules = constantsQuery.data?.scrollModules || [];
  const currentModule = scrollModules.find((m: any) => m.num === moduleNum);

  // Load existing entries into state
  useEffect(() => {
    if (entriesQuery.data) {
      const loaded: Record<string, string> = {};
      for (const e of entriesQuery.data) {
        loaded[e.promptId] = e.responseText || "";
      }
      setResponses(loaded);
    }
  }, [entriesQuery.data]);

  const handleSave = async (promptId: string) => {
    const text = responses[promptId];
    if (!text?.trim()) return;
    setSaving(promptId);
    await saveMutation.mutateAsync({ moduleNum, promptId, responseText: text.trim() });
    setSaving(null);
  };

  if (constantsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-50 to-blue-50/30">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!currentModule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-50 to-blue-50/30">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Module not found</p>
          <Button variant="outline" onClick={() => setLocation("/account/codex")}>Back to Portal</Button>
        </div>
      </div>
    );
  }

  const promptTypeStyles: Record<string, string> = {
    reflection: "border-l-blue-400",
    somatic: "border-l-emerald-400",
    ritual: "border-l-purple-400",
    ledger: "border-l-amber-400",
    letter: "border-l-rose-400",
  };

  const promptTypeLabels: Record<string, string> = {
    reflection: "Reflection",
    somatic: "Somatic Practice",
    ritual: "Ritual",
    ledger: "Sovereignty Ledger",
    letter: "Letter",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-blue-50/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/account/codex")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Portal
          </Button>
          <div className="flex items-center gap-2">
            {moduleNum > 1 && (
              <Button variant="outline" size="sm" onClick={() => setLocation(`/account/codex/scroll/${moduleNum - 1}`)}>
                <ArrowLeft className="w-3 h-3 mr-1" /> Module {moduleNum - 1}
              </Button>
            )}
            {moduleNum < 9 && (
              <Button variant="outline" size="sm" onClick={() => setLocation(`/account/codex/scroll/${moduleNum + 1}`)}>
                Module {moduleNum + 1} <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Module Header */}
        <div className="text-center py-6">
          <span className="text-4xl">{currentModule.glyph}</span>
          <h1 className="text-2xl font-bold mt-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Module {currentModule.num}: {currentModule.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 italic">{currentModule.subtitle}</p>
          <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">{currentModule.description}</p>
        </div>

        {/* Prompts */}
        <div className="space-y-6">
          {currentModule.prompts.map((p: any) => {
            const saved = entriesQuery.data?.some((e: any) => e.promptId === p.id && e.responseText);
            return (
              <Card key={p.id} className={`overflow-hidden border-l-4 ${promptTypeStyles[p.type] || "border-l-stone-300"}`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs capitalize">{promptTypeLabels[p.type] || p.type}</Badge>
                    {saved && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>

                  <p className="text-base leading-relaxed">{p.text}</p>

                  <Textarea
                    value={responses[p.id] || ""}
                    onChange={e => setResponses(prev => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder={p.placeholder || "Write here…"}
                    className="min-h-[120px] text-base bg-stone-50/50"
                  />

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSave(p.id)}
                    disabled={saving === p.id || !responses[p.id]?.trim()}
                  >
                    {saving === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Save Response
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Module Nav Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          {moduleNum > 1 ? (
            <Button variant="outline" onClick={() => setLocation(`/account/codex/scroll/${moduleNum - 1}`)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Previous Module
            </Button>
          ) : <div />}
          {moduleNum < 9 ? (
            <Button onClick={() => setLocation(`/account/codex/scroll/${moduleNum + 1}`)}>
              Next Module <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => setLocation("/account/codex")}>
              Complete Scroll <CheckCircle2 className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
