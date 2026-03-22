import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminSidebar from "@/components/AdminSidebar";
import { Shield, Plus, Pencil, Trash2, Save, X, AlertTriangle, BookOpen, Phone, FileText, Activity } from "lucide-react";

const API_BASE = "/api/trpc";

async function trpcQuery(path: string, input?: any, token?: string) {
  const url = input
    ? `${API_BASE}/${path}?input=${encodeURIComponent(JSON.stringify(input))}`
    : `${API_BASE}/${path}`;
  const res = await fetch(url, { headers: { "x-admin-token": token || "" } });
  const json = await res.json();
  return json.result?.data;
}

async function trpcMutate(path: string, input: any, token?: string) {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-token": token || "" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  return json.result?.data;
}

const TABS = [
  { id: "governance", label: "System Prompts & Guardrails", icon: BookOpen },
  { id: "resources", label: "Crisis Resources", icon: Phone },
  { id: "templates", label: "Response Templates", icon: FileText },
  { id: "logs", label: "Escalation Log", icon: Activity },
] as const;

const GOV_CATEGORIES = [
  { value: "system_prompt", label: "System Prompt" },
  { value: "guardrail", label: "Guardrail" },
  { value: "voice_direction", label: "Voice & Tone Direction" },
  { value: "restricted_claims", label: "Restricted Claims" },
  { value: "content_boundary", label: "Content Boundary" },
  { value: "escalation_rule", label: "Escalation Rule" },
];

const RESOURCE_CATEGORIES = [
  "suicide_crisis", "domestic_violence", "sexual_assault", "eating_disorder",
  "substance_abuse", "child_abuse", "lgbtq_support", "veterans", "general_mental_health",
];

const SEVERITY_LEVELS = ["critical", "high", "medium", "low"];

type Tab = typeof TABS[number]["id"];

export default function AdminAIGovernance() {
  const { token } = useAdminAuth();
  const [tab, setTab] = useState<Tab>("governance");

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar variant="dark" />
      <main className="flex-1 p-6 ml-16 lg:ml-64 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">AI Governance</h1>
              <p className="text-gray-400 text-sm">Control the AI guide system prompts, guardrails, escalation resources, and response templates</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  tab === t.id ? "bg-gray-800 text-purple-400 border-b-2 border-purple-400" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          {tab === "governance" && <GovernanceTab token={token} />}
          {tab === "resources" && <ResourcesTab token={token} />}
          {tab === "templates" && <TemplatesTab token={token} />}
          {tab === "logs" && <LogsTab token={token} />}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// GOVERNANCE CONFIG TAB
// ═══════════════════════════════════════════════════════════
function GovernanceTab({ token }: { token: string | null }) {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [filterCat, setFilterCat] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await trpcQuery("governance.list", filterCat ? { category: filterCat } : {}, token || "");
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterCat]);

  const save = async () => {
    if (!editing) return;
    await trpcMutate("governance.upsert", editing, token || "");
    setEditing(null);
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this governance config?")) return;
    await trpcMutate("governance.del", { id }, token || "");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-gray-800 text-gray-200 border border-gray-700 rounded px-3 py-1.5 text-sm">
            <option value="">All Categories</option>
            {GOV_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <button onClick={() => setEditing({ configKey: "", configValue: "", category: "guardrail", guideId: null, label: "", description: "", isActive: 1 })} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm">
          <Plus className="w-4 h-4" /> Add Config
        </button>
      </div>

      {editing && (
        <div className="bg-gray-900 border border-purple-500/30 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Config Key</label>
              <input value={editing.configKey} onChange={e => setEditing({ ...editing, configKey: e.target.value })} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 text-sm" placeholder="e.g. governance_block_v1" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Category</label>
              <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 text-sm">
                {GOV_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Label</label>
              <input value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 text-sm" placeholder="Human-readable name" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Guide (optional, blank = all guides)</label>
              <input value={editing.guideId || ""} onChange={e => setEditing({ ...editing, guideId: e.target.value || null })} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 text-sm" placeholder="e.g. orientation, archetype" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">Description</label>
            <input value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Config Value (prompt text, rule text, etc.)</label>
            <textarea value={editing.configValue} onChange={e => setEditing({ ...editing, configValue: e.target.value })} rows={6} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm font-mono" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={editing.isActive === 1} onChange={e => setEditing({ ...editing, isActive: e.target.checked ? 1 : 0 })} /> Active
            </label>
            <div className="flex-1" />
            <button onClick={() => setEditing(null)} className="px-4 py-1.5 text-gray-400 hover:text-white text-sm"><X className="w-4 h-4 inline mr-1" />Cancel</button>
            <button onClick={save} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm"><Save className="w-4 h-4" />Save</button>
          </div>
        </div>
      )}

      {loading ? <p className="text-gray-500 text-sm">Loading...</p> : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className={`bg-gray-900 border rounded-lg p-4 ${item.isActive ? "border-gray-800" : "border-red-900/30 opacity-60"}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">{item.category}</span>
                    {item.guideId && <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">{item.guideId}</span>}
                    {!item.isActive && <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300">Inactive</span>}
                  </div>
                  <h3 className="text-white font-medium text-sm">{item.label}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{item.configKey}</p>
                  {item.description && <p className="text-gray-400 text-xs mt-1">{item.description}</p>}
                  <pre className="text-gray-300 text-xs mt-2 bg-gray-800 rounded p-2 max-h-32 overflow-auto whitespace-pre-wrap">{item.configValue.slice(0, 500)}{item.configValue.length > 500 ? "..." : ""}</pre>
                </div>
                <div className="flex gap-1 ml-3">
                  <button onClick={() => setEditing(item)} className="p-1.5 text-gray-400 hover:text-blue-400"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => del(item.id)} className="p-1.5 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No governance configs yet. Click "Add Config" to create one.</p>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ESCALATION RESOURCES TAB
// ═══════════════════════════════════════════════════════════
function ResourcesTab({ token }: { token: string | null }) {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await trpcQuery("governance.resources", undefined, token || "");
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    await trpcMutate("governance.resourceUpsert", editing, token || "");
    setEditing(null);
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this resource?")) return;
    await trpcMutate("governance.resourceDelete", { id }, token || "");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">Crisis hotlines, websites, and contacts offered during escalation events</p>
        <button onClick={() => setEditing({ name: "", contact: "", url: "", availability: "24/7", category: "general_mental_health", triggerTypes: "", displayOrder: 0, isActive: 1 })} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm">
          <Plus className="w-4 h-4" /> Add Resource
        </button>
      </div>

      {editing && (
        <div className="bg-gray-900 border border-purple-500/30 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Name</label>
              <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 text-sm" placeholder="988 Suicide & Crisis Lifeline" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Contact (phone, text instructions)</label>
              <input value={editing.contact} onChange={e => setEditing({ ...editing, contact: e.target.value })} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 text-sm" placeholder="Call or text 988" />
            </div>
            <div>
              <label className="text-xs text-gray-400">URL</label>
              <input value={editing.url || ""} onChange={e => setEditing({ ...editing, url: e.target.value })} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 text-sm" placeholder="https://988lifeline.org" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Availability</label>
              <input value={editing.availability} onChange={e => setEditing({ ...editing, availability: e.target.value })} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 text-sm" placeholder="24/7" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Category</label>
              <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 text-sm">
                {RESOURCE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Display Order</label>
              <input type="number" value={editing.displayOrder} onChange={e => setEditing({ ...editing, displayOrder: parseInt(e.target.value) || 0 })} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">Trigger Types (comma-separated, e.g. suicide_ideation,self_harm)</label>
            <input value={editing.triggerTypes || ""} onChange={e => setEditing({ ...editing, triggerTypes: e.target.value })} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={editing.isActive === 1} onChange={e => setEditing({ ...editing, isActive: e.target.checked ? 1 : 0 })} /> Active
            </label>
            <div className="flex-1" />
            <button onClick={() => setEditing(null)} className="px-4 py-1.5 text-gray-400 hover:text-white text-sm">Cancel</button>
            <button onClick={save} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm"><Save className="w-4 h-4" />Save</button>
          </div>
        </div>
      )}

      {loading ? <p className="text-gray-500 text-sm">Loading...</p> : (
        <div className="grid gap-2">
          {items.map(item => (
            <div key={item.id} className={`bg-gray-900 border rounded-lg p-3 flex items-center gap-4 ${item.isActive ? "border-gray-800" : "border-red-900/30 opacity-60"}`}>
              <Phone className="w-5 h-5 text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{item.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{item.category.replace(/_/g, " ")}</span>
                </div>
                <p className="text-green-300 text-sm">{item.contact}</p>
                {item.url && <p className="text-gray-500 text-xs truncate">{item.url}</p>}
              </div>
              <span className="text-gray-500 text-xs">{item.availability}</span>
              <button onClick={() => setEditing(item)} className="p-1.5 text-gray-400 hover:text-blue-400"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => del(item.id)} className="p-1.5 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {items.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No resources yet. Add crisis hotlines and support contacts.</p>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// RESPONSE TEMPLATES TAB
// ═══════════════════════════════════════════════════════════
function TemplatesTab({ token }: { token: string | null }) {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await trpcQuery("governance.templates", undefined, token || "");
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    await trpcMutate("governance.templateUpsert", editing, token || "");
    setEditing(null);
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this template?")) return;
    await trpcMutate("governance.templateDelete", { id }, token || "");
    load();
  };

  const severityColor: Record<string, string> = {
    critical: "text-red-400 bg-red-500/20",
    high: "text-orange-400 bg-orange-500/20",
    medium: "text-yellow-400 bg-yellow-500/20",
    low: "text-blue-400 bg-blue-500/20",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">Response templates used when an escalation event is triggered, by severity level</p>
        <button onClick={() => setEditing({ severity: "medium", templateText: "", label: "", isActive: 1 })} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm">
          <Plus className="w-4 h-4" /> Add Template
        </button>
      </div>

      {editing && (
        <div className="bg-gray-900 border border-purple-500/30 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Severity</label>
              <select value={editing.severity} onChange={e => setEditing({ ...editing, severity: e.target.value })} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 text-sm">
                {SEVERITY_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Label (optional)</label>
              <input value={editing.label || ""} onChange={e => setEditing({ ...editing, label: e.target.value })} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 text-sm" placeholder="e.g. Suicide crisis primary" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">Template Text</label>
            <textarea value={editing.templateText} onChange={e => setEditing({ ...editing, templateText: e.target.value })} rows={8} className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm font-mono" placeholder="The AI will use this template text when responding to an escalation at this severity level..." />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={editing.isActive === 1} onChange={e => setEditing({ ...editing, isActive: e.target.checked ? 1 : 0 })} /> Active
            </label>
            <div className="flex-1" />
            <button onClick={() => setEditing(null)} className="px-4 py-1.5 text-gray-400 hover:text-white text-sm">Cancel</button>
            <button onClick={save} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm"><Save className="w-4 h-4" />Save</button>
          </div>
        </div>
      )}

      {loading ? <p className="text-gray-500 text-sm">Loading...</p> : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className={`bg-gray-900 border rounded-lg p-4 ${item.isActive ? "border-gray-800" : "border-red-900/30 opacity-60"}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${severityColor[item.severity] || "text-gray-400 bg-gray-700"}`}>{item.severity.toUpperCase()}</span>
                    {item.label && <span className="text-gray-400 text-xs">{item.label}</span>}
                  </div>
                  <pre className="text-gray-300 text-xs mt-2 bg-gray-800 rounded p-2 max-h-40 overflow-auto whitespace-pre-wrap">{item.templateText}</pre>
                </div>
                <div className="flex gap-1 ml-3">
                  <button onClick={() => setEditing(item)} className="p-1.5 text-gray-400 hover:text-blue-400"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => del(item.id)} className="p-1.5 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No templates yet. Add response templates for each severity level.</p>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ESCALATION LOG TAB
// ═══════════════════════════════════════════════════════════
function LogsTab({ token }: { token: string | null }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await trpcQuery("governance.logs", { limit: 100 }, token || "");
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resolve = async (id: number) => {
    const notes = prompt("Resolution notes (optional):");
    await trpcMutate("governance.logResolve", { id, notes: notes || undefined }, token || "");
    load();
  };

  const severityColor: Record<string, string> = {
    critical: "border-l-red-500 bg-red-500/5",
    high: "border-l-orange-500 bg-orange-500/5",
    medium: "border-l-yellow-500 bg-yellow-500/5",
    low: "border-l-blue-500 bg-blue-500/5",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">Audit trail of all escalation events triggered by the AI system</p>
        <button onClick={load} className="text-gray-400 hover:text-white text-sm px-3 py-1.5 border border-gray-700 rounded">Refresh</button>
      </div>

      {loading ? <p className="text-gray-500 text-sm">Loading...</p> : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className={`bg-gray-900 border-l-4 rounded-r-lg p-3 ${severityColor[log.severity] || "border-l-gray-500"}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{log.severity.toUpperCase()}</span>
                    <span className="text-xs text-gray-400">{log.triggerType}</span>
                    <span className="text-xs text-gray-600">{log.action}</span>
                    {log.resolved ? <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">Resolved</span> : <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">Open</span>}
                  </div>
                  {log.userMessageExcerpt && <p className="text-gray-300 text-xs mt-1 italic">"{log.userMessageExcerpt}"</p>}
                  {log.detectedPatterns && <p className="text-gray-500 text-xs mt-0.5">Patterns: {log.detectedPatterns}</p>}
                  {log.notes && <p className="text-gray-400 text-xs mt-1 bg-gray-800 rounded p-1.5">Notes: {log.notes}</p>}
                  <p className="text-gray-600 text-xs mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
                {!log.resolved && (
                  <button onClick={() => resolve(log.id)} className="text-xs text-green-400 hover:text-green-300 border border-green-500/30 rounded px-2 py-1">Resolve</button>
                )}
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No escalation events logged yet.</p>
              <p className="text-gray-600 text-xs mt-1">Events will appear here when the AI triggers an escalation response.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
