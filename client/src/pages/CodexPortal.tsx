import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, ScrollText, Eye, BookOpen, Lock, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export default function CodexPortal() {
  const [, setLocation] = useLocation();
  const portalQuery = trpc.codex.client.portal.useQuery();
  const constantsQuery = trpc.codex.client.constants.useQuery();

  const portal = portalQuery.data;
  const tiers = constantsQuery.data?.journeyTiers || [];
  const scrollModules = constantsQuery.data?.scrollModules || [];

  if (portalQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-50 to-amber-50/30">
        <div className="text-center">
          <Flame className="w-12 h-12 text-amber-500 animate-pulse mx-auto mb-3" />
          <p className="text-muted-foreground">Loading your Codex…</p>
        </div>
      </div>
    );
  }

  if (!portal?.user?.tier) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Flame className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>The Living Codex™</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">A sacred diagnostic and transformational journey for women ready to meet their archetypal truth.</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map(t => (
            <Card key={t.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{t.name}</CardTitle>
                <CardDescription>{t.sessions}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <p className="text-2xl font-bold">{t.priceDisplay}</p>
                <ul className="space-y-1">
                  {t.includes.map((inc: string) => (
                    <li key={inc} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {inc}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => setLocation(`/account/codex/purchase?tier=${t.id}`)}>
                  Begin Journey <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const assessmentStatus = portal.assessment?.status || "not_started";
  const hasScoring = !!portal.scoring;
  const reportStatus = portal.mirrorReport?.status || "none";
  const completedModules = portal.scrollProgress || [];
  const tierLabel = portal.user.tier?.replace("_", " ") || "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <Flame className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Your Living Codex™</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {portal.user.name || "Sacred One"}</p>
          <Badge className="mt-2 bg-amber-100 text-amber-800 capitalize">{tierLabel} Journey</Badge>
        </div>

        {/* Journey Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assessment */}
          <Card className="overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-400 to-rose-400" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">The Assessment</h3>
                  <p className="text-xs text-muted-foreground">16-section archetypal diagnostic</p>
                </div>
              </div>
              {assessmentStatus === "not_started" && (
                <Button className="w-full" onClick={() => setLocation("/account/codex/assessment")}>Begin Assessment <ArrowRight className="w-4 h-4 ml-1" /></Button>
              )}
              {assessmentStatus === "in_progress" && (
                <>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Section {portal.assessment?.currentSection} of 16</span>
                      <span>{Math.round(((portal.assessment?.currentSection || 1) / 16) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full transition-all" style={{ width: `${((portal.assessment?.currentSection || 1) / 16) * 100}%` }} />
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setLocation("/account/codex/assessment")}>Continue Assessment <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </>
              )}
              {assessmentStatus === "complete" && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Assessment Complete</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mirror Report */}
          <Card className="overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-purple-400 to-blue-400" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Mirror Report</h3>
                  <p className="text-xs text-muted-foreground">Your archetypal reflection</p>
                </div>
              </div>
              {reportStatus === "none" && !hasScoring && (
                <div className="flex items-center gap-2 text-muted-foreground"><Lock className="w-4 h-4" /><span className="text-sm">Complete your assessment first</span></div>
              )}
              {reportStatus === "none" && hasScoring && (
                <div className="flex items-center gap-2 text-amber-600"><Sparkles className="w-4 h-4" /><span className="text-sm">Your report is being prepared…</span></div>
              )}
              {(reportStatus === "generating" || reportStatus === "ready_for_review") && (
                <div className="flex items-center gap-2 text-amber-600"><Sparkles className="w-4 h-4 animate-pulse" /><span className="text-sm">April is reviewing your report…</span></div>
              )}
              {reportStatus === "released" && (
                <Button className="w-full" variant="outline" onClick={() => setLocation("/account/codex/mirror-report")}>View Mirror Report <ArrowRight className="w-4 h-4 ml-1" /></Button>
              )}
            </CardContent>
          </Card>

          {/* Scroll Journal */}
          <Card className="overflow-hidden md:col-span-2">
            <div className="h-1 bg-gradient-to-r from-blue-400 to-emerald-400" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <ScrollText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">The Scroll — 9-Module Journey</h3>
                  <p className="text-xs text-muted-foreground">Your guided path of reflection, embodiment, and integration</p>
                </div>
              </div>
              {!hasScoring ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Lock className="w-4 h-4" /><span className="text-sm">Complete your assessment to unlock the Scroll</span></div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
                  {scrollModules.map((m: any) => {
                    const done = completedModules.includes(m.num);
                    return (
                      <button
                        key={m.num}
                        onClick={() => setLocation(`/account/codex/scroll/${m.num}`)}
                        className={`p-3 rounded-lg text-center transition-all hover:shadow-md ${done ? "bg-emerald-50 border border-emerald-200" : "bg-stone-50 border border-stone-200 hover:border-blue-300"}`}
                      >
                        <span className="text-lg block">{m.glyph}</span>
                        <span className="text-[10px] font-medium block mt-1">{m.num}</span>
                        {done && <CheckCircle2 className="w-3 h-3 text-emerald-500 mx-auto mt-1" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
