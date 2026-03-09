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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Flame, Users, FileCheck, Clock, Eye, ScrollText, StickyNote, ChevronLeft, Search, ArrowUpDown } from "lucide-react";

export default function AdminCodexClients() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [tierDialog, setTierDialog] = useState<{ userId: string; currentTier: string | null } | null>(null);
  const [newTier, setNewTier] = useState("");

  const clientsQuery = trpc.codex.admin.clients.useQuery(undefined, { enabled: isAuthenticated });
  const statsQuery = trpc.codex.admin.stats.useQuery(undefined, { enabled: isAuthenticated });
  const detailQuery = trpc.codex.admin.clientDetail.useQuery({ userId: selectedUserId! }, { enabled: !!selectedUserId && isAuthenticated });

  const addNoteMutation = trpc.codex.admin.addNote.useMutation({ onSuccess: () => { detailQuery.refetch(); setNoteText(""); } });
  const deleteNoteMutation = trpc.codex.admin.deleteNote.useMutation({ onSuccess: () => detailQuery.refetch() });
  const updateTierMutation = trpc.codex.admin.updateClientTier.useMutation({ onSuccess: () => { clientsQuery.refetch(); detailQuery.refetch(); setTierDialog(null); } });
  const releaseReportMutation = trpc.codex.admin.releaseReport.useMutation({ onSuccess: () => detailQuery.refetch() });

  if (isChecking) return null;
  if (!isAuthenticated) { setLocation("/admin/login"); return null; }

  const clients = clientsQuery.data || [];
  const stats = statsQuery.data;
  const detail = detailQuery.data;
  const filtered = clients.filter(c => !search || (c.name || "").toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  const tierColors: Record<string, string> = { threshold: "bg-amber-100 text-amber-800", self_guided: "bg-blue-100 text-blue-800", awakening: "bg-purple-100 text-purple-800", reclamation: "bg-rose-100 text-rose-800", legacy: "bg-emerald-100 text-emerald-800" };
  const statusColors: Record<string, string> = { none: "bg-stone-100 text-stone-600", not_started: "bg-stone-100 text-stone-600", in_progress: "bg-amber-100 text-amber-700", complete: "bg-emerald-100 text-emerald-700" };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Clients", value: stats?.totalClients || 0, icon: Users, color: "text-blue-500" },
          { label: "Active Assessments", value: stats?.activeAssessments || 0, icon: Clock, color: "text-amber-500" },
          { label: "Completed", value: stats?.completedAssessments || 0, icon: FileCheck, color: "text-emerald-500" },
          { label: "Pending Reports", value: stats?.pendingReports || 0, icon: Eye, color: "text-purple-500" },
          { label: "Released Reports", value: stats?.releasedReports || 0, icon: ScrollText, color: "text-rose-500" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No clients found</p>}
          {filtered.map(c => (
            <Card key={c.id} className={`cursor-pointer transition hover:shadow-md ${selectedUserId === c.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedUserId(c.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold truncate">{c.name || c.email}</span>
                  {c.tier && <Badge className={tierColors[c.tier] || "bg-stone-100"}>{c.tier.replace("_", " ")}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={statusColors[c.assessmentStatus]}>Assessment: {c.assessmentStatus}</Badge>
                  {c.noteCount > 0 && <Badge variant="outline"><StickyNote className="w-3 h-3 mr-1" />{c.noteCount}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Client Detail */}
        <div className="lg:col-span-2">
          {!selectedUserId ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground"><Flame className="w-12 h-12 mx-auto mb-3 text-amber-300" /><p>Select a client to view their Codex journey</p></CardContent></Card>
          ) : detail ? (
            <div className="space-y-4">
              {/* Header */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{detail.user.name || detail.user.email}</h2>
                      <p className="text-sm text-muted-foreground">{detail.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={detail.user.tier ? tierColors[detail.user.tier] || "" : "bg-stone-100 text-stone-600"}>{detail.user.tier || "No tier"}</Badge>
                      <Button size="sm" variant="outline" onClick={() => setTierDialog({ userId: detail.user.id, currentTier: detail.user.tier })}>Change Tier</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assessments */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Assessments</CardTitle></CardHeader>
                <CardContent>
                  {detail.assessments.length === 0 ? <p className="text-sm text-muted-foreground">No assessments yet</p> : (
                    <div className="space-y-2">
                      {detail.assessments.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <Badge className={statusColors[a.status]}>{a.status}</Badge>
                            <span className="text-xs text-muted-foreground ml-2">S{a.currentSection}/Q{a.currentQuestion}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mirror Reports */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Mirror Reports</CardTitle></CardHeader>
                <CardContent>
                  {detail.reports.length === 0 ? <p className="text-sm text-muted-foreground">No reports yet</p> : (
                    <div className="space-y-2">
                      {detail.reports.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <Badge className={r.status === "released" ? "bg-emerald-100 text-emerald-700" : r.status === "ready_for_review" ? "bg-amber-100 text-amber-700" : "bg-stone-100"}>{r.status}</Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{r.generatedAt ? new Date(r.generatedAt).toLocaleDateString() : ""}</span>
                            {r.status === "ready_for_review" && (
                              <Button size="sm" onClick={() => releaseReportMutation.mutate({ reportId: r.id })} disabled={releaseReportMutation.isPending}>Release to Client</Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Scroll Progress */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Scroll Progress</CardTitle></CardHeader>
                <CardContent>
                  {detail.scrollEntries.length === 0 ? <p className="text-sm text-muted-foreground">No scroll entries yet</p> : (
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(detail.scrollEntries.map(e => e.moduleNum))).sort().map(m => (
                        <Badge key={m} className="bg-blue-100 text-blue-700">Module {m}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Admin Notes */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Admin Notes</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Textarea placeholder="Add a note..." value={noteText} onChange={e => setNoteText(e.target.value)} className="min-h-[60px]" />
                    <Button onClick={() => { if (noteText.trim()) addNoteMutation.mutate({ userId: selectedUserId!, content: noteText.trim() }); }} disabled={!noteText.trim() || addNoteMutation.isPending}>Add</Button>
                  </div>
                  {detail.notes.map(n => (
                    <div key={n.id} className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}</span>
                        <Button size="sm" variant="ghost" className="text-destructive h-6 text-xs" onClick={() => deleteNoteMutation.mutate({ noteId: n.id })}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          )}
        </div>
      </div>

      {/* Tier Dialog */}
      <Dialog open={!!tierDialog} onOpenChange={() => setTierDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Client Tier</DialogTitle></DialogHeader>
          <Select value={newTier} onValueChange={setNewTier}>
            <SelectTrigger><SelectValue placeholder="Select tier..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No tier</SelectItem>
              <SelectItem value="threshold">Threshold Session</SelectItem>
              <SelectItem value="self_guided">Self-Guided Journey</SelectItem>
              <SelectItem value="awakening">Awakening Arc</SelectItem>
              <SelectItem value="reclamation">Reclamation Path</SelectItem>
              <SelectItem value="legacy">Legacy Immersion</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { if (tierDialog) updateTierMutation.mutate({ userId: tierDialog.userId, tier: newTier === "none" ? null : newTier }); }} disabled={updateTierMutation.isPending}>Save</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
