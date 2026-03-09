import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Flame, Users, FileCheck, Clock, Eye, ScrollText, StickyNote, Search, Send, Trash2, ArrowRight } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminCodexClients() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [tierDialog, setTierDialog] = useState<{ userId: string; currentTier: string | null } | null>(null);
  const [newTier, setNewTier] = useState("");
  const [releaseDialog, setReleaseDialog] = useState<{ reportId: string } | null>(null);
  const [releaseNote, setReleaseNote] = useState("");

  const clientsQuery = trpc.codex.admin.clients.useQuery(undefined, { enabled: isAuthenticated });
  const statsQuery = trpc.codex.admin.stats.useQuery(undefined, { enabled: isAuthenticated });
  const detailQuery = trpc.codex.admin.clientDetail.useQuery({ userId: selectedUserId! }, { enabled: !!selectedUserId && isAuthenticated });

  const addNoteMutation = trpc.codex.admin.addNote.useMutation({ onSuccess: () => { detailQuery.refetch(); setNoteText(""); } });
  const deleteNoteMutation = trpc.codex.admin.deleteNote.useMutation({ onSuccess: () => detailQuery.refetch() });
  const updateTierMutation = trpc.codex.admin.updateClientTier.useMutation({ onSuccess: () => { clientsQuery.refetch(); detailQuery.refetch(); setTierDialog(null); } });
  const releaseReportMutation = trpc.codex.admin.releaseReport.useMutation({ onSuccess: () => { detailQuery.refetch(); setReleaseDialog(null); setReleaseNote(""); } });

  if (isChecking) return null;
  if (!isAuthenticated) { setLocation("/admin/login"); return null; }

  const clients = clientsQuery.data || [];
  const stats = statsQuery.data;
  const detail = detailQuery.data;
  const filtered = clients.filter(c => !search || (c.name || "").toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  const tierLabels: Record<string, string> = { threshold: "Threshold", self_guided: "Self-Guided", awakening: "Awakening", reclamation: "Reclamation", legacy: "Legacy" };
  const tierColors: Record<string, string> = { threshold: "bg-amber-100 text-amber-800", self_guided: "bg-blue-100 text-blue-800", awakening: "bg-purple-100 text-purple-800", reclamation: "bg-rose-100 text-rose-800", legacy: "bg-emerald-100 text-emerald-800" };
  const statusColors: Record<string, string> = { none: "bg-stone-100 text-stone-600", not_started: "bg-stone-100 text-stone-600", in_progress: "bg-amber-100 text-amber-700", complete: "bg-emerald-100 text-emerald-700" };
  const reportStatusColors: Record<string, string> = { generating: "bg-stone-100 text-stone-600", ready_for_review: "bg-amber-100 text-amber-700", released: "bg-emerald-100 text-emerald-700" };

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar variant="dark" />
      <main className="flex-1 p-8 overflow-auto">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Flame className="w-6 h-6 text-amber-500" />
        <div>
          <h1 className="text-xl font-bold">Living Codex — Clients</h1>
          <p className="text-sm text-muted-foreground">Manage client journeys, assessments, reports, and notes</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Clients", value: stats?.totalClients || 0, Icon: Users, color: "text-blue-500" },
          { label: "Active", value: stats?.activeAssessments || 0, Icon: Clock, color: "text-amber-500" },
          { label: "Completed", value: stats?.completedAssessments || 0, Icon: FileCheck, color: "text-emerald-500" },
          { label: "Pending Review", value: stats?.pendingReports || 0, Icon: Eye, color: "text-purple-500" },
          { label: "Released", value: stats?.releasedReports || 0, Icon: ScrollText, color: "text-rose-500" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 flex items-center gap-3">
              <s.Icon className={`w-7 h-7 ${s.color} flex-shrink-0`} />
              <div>
                <p className="text-xl font-bold leading-tight">{s.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '60vh' }}>
        {/* Left: Client list */}
        <div className="lg:col-span-1 space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">No clients found</p>}
          {filtered.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedUserId(c.id)}
              className={`p-3 rounded-lg cursor-pointer border transition-all ${selectedUserId === c.id ? "border-primary bg-primary/5 shadow-sm" : "border-transparent hover:bg-muted/50"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate">{c.name || c.email}</span>
                {c.tier && <Badge className={`text-[10px] px-1.5 py-0 ${tierColors[c.tier] || "bg-stone-100"}`}>{tierLabels[c.tier] || c.tier}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{c.email}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[c.assessmentStatus] || ""}`}>{c.assessmentStatus === "not_started" ? "Not Started" : c.assessmentStatus === "in_progress" ? "In Progress" : c.assessmentStatus === "complete" ? "Complete" : "None"}</Badge>
                {(c.reportStatus === "ready_for_review") && <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700">Review</Badge>}
                {Number(c.noteCount) > 0 && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><StickyNote className="w-2.5 h-2.5" />{c.noteCount}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Detail panel */}
        <div className="lg:col-span-2">
          {!selectedUserId ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center p-12">
                <Flame className="w-10 h-10 mx-auto mb-3 text-amber-300/50" />
                <p className="text-sm text-muted-foreground">Select a client to view their Codex journey</p>
              </CardContent>
            </Card>
          ) : !detail ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center p-8 text-muted-foreground text-sm">Loading…</CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Client header */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="text-lg font-bold">{detail.user.name || detail.user.email}</h2>
                      <p className="text-xs text-muted-foreground">{detail.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={detail.user.tier ? tierColors[detail.user.tier] || "" : "bg-stone-100 text-stone-600"}>
                        {detail.user.tier ? tierLabels[detail.user.tier] || detail.user.tier : "No tier"}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => { setNewTier(detail.user.tier || "none"); setTierDialog({ userId: detail.user.id, currentTier: detail.user.tier }); }}>
                        Change Tier
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assessments */}
              <Card>
                <CardHeader className="pb-2 px-4 pt-4"><CardTitle className="text-sm font-semibold">Assessments</CardTitle></CardHeader>
                <CardContent className="px-4 pb-4">
                  {detail.assessments.length === 0 ? <p className="text-xs text-muted-foreground">No assessments</p> : (
                    <div className="space-y-1.5">
                      {detail.assessments.map((a: any) => (
                        <div key={a.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-md">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[a.status] || ""}`}>{a.status}</Badge>
                            <span className="text-xs text-muted-foreground">Section {a.currentSection} · Q{a.currentQuestion}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mirror Reports */}
              <Card>
                <CardHeader className="pb-2 px-4 pt-4"><CardTitle className="text-sm font-semibold">Mirror Reports</CardTitle></CardHeader>
                <CardContent className="px-4 pb-4">
                  {detail.reports.length === 0 ? <p className="text-xs text-muted-foreground">No reports</p> : (
                    <div className="space-y-1.5">
                      {detail.reports.map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-md">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[10px] px-1.5 py-0 ${reportStatusColors[r.status] || "bg-stone-100"}`}>{r.status.replace(/_/g, " ")}</Badge>
                            <span className="text-[10px] text-muted-foreground">{r.generatedAt ? new Date(r.generatedAt).toLocaleDateString() : ""}</span>
                          </div>
                          {r.status === "ready_for_review" && (
                            <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => setReleaseDialog({ reportId: r.id })}>
                              Release <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                          {r.status === "released" && r.releasedAt && (
                            <span className="text-[10px] text-emerald-600">Released {new Date(r.releasedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Scroll Progress */}
              <Card>
                <CardHeader className="pb-2 px-4 pt-4"><CardTitle className="text-sm font-semibold">Scroll Progress</CardTitle></CardHeader>
                <CardContent className="px-4 pb-4">
                  {detail.scrollEntries.length === 0 ? <p className="text-xs text-muted-foreground">No scroll entries</p> : (
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(detail.scrollEntries.map((e: any) => e.moduleNum))).sort((a: any, b: any) => a - b).map((m: any) => (
                        <Badge key={m} variant="outline" className="text-[10px]">Module {m}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Admin Notes */}
              <Card>
                <CardHeader className="pb-2 px-4 pt-4"><CardTitle className="text-sm font-semibold">Admin Notes</CardTitle></CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="flex gap-2">
                    <Textarea placeholder="Add a note…" value={noteText} onChange={e => setNoteText(e.target.value)} className="min-h-[50px] text-sm" />
                    <Button size="sm" className="self-end" onClick={() => { if (noteText.trim()) addNoteMutation.mutate({ userId: selectedUserId!, content: noteText.trim() }); }} disabled={!noteText.trim() || addNoteMutation.isPending}>
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {(detail.notes || []).map((n: any) => (
                    <div key={n.id} className="p-2.5 bg-muted/40 rounded-md group">
                      <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-muted-foreground">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}</span>
                        <Button size="sm" variant="ghost" className="text-destructive h-5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteNoteMutation.mutate({ noteId: n.id })}>
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Tier Dialog */}
      <Dialog open={!!tierDialog} onOpenChange={() => setTierDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Client Tier</DialogTitle></DialogHeader>
          <Select value={newTier} onValueChange={setNewTier}>
            <SelectTrigger><SelectValue placeholder="Select tier…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No tier (remove access)</SelectItem>
              <SelectItem value="threshold">Threshold Session</SelectItem>
              <SelectItem value="self_guided">Self-Guided Journey</SelectItem>
              <SelectItem value="awakening">Awakening Arc</SelectItem>
              <SelectItem value="reclamation">Reclamation Path</SelectItem>
              <SelectItem value="legacy">Legacy Immersion</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTierDialog(null)}>Cancel</Button>
            <Button onClick={() => { if (tierDialog) updateTierMutation.mutate({ userId: tierDialog.userId, tier: newTier === "none" ? null : newTier }); }} disabled={updateTierMutation.isPending}>
              {updateTierMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Release Report Dialog */}
      <Dialog open={!!releaseDialog} onOpenChange={() => setReleaseDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Release Mirror Report</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will make the report visible to the client. You can optionally include a personal note that will appear at the end of their report.
          </p>
          <Textarea
            placeholder="Optional closing note for the client…"
            value={releaseNote}
            onChange={e => setReleaseNote(e.target.value)}
            className="min-h-[80px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseDialog(null)}>Cancel</Button>
            <Button
              onClick={() => { if (releaseDialog) releaseReportMutation.mutate({ reportId: releaseDialog.reportId, aprilNote: releaseNote || undefined }); }}
              disabled={releaseReportMutation.isPending}
            >
              {releaseReportMutation.isPending ? "Releasing…" : "Release to Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </main>
    </div>
  );
}
