import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import {
  Save, Loader2, RefreshCw, FileCode, Copy,
  History, Trash2, AlertTriangle, Zap, Terminal, Palette,
  ChevronDown, ChevronRight, FolderOpen, File,
  Search, X, RotateCcw, Clock, FileText, Braces,
  Bot, Send, Wand2, Bug, MessageSquare, FileQuestion, TestTube,
  Lightbulb, PanelRightOpen, PanelRightClose, Check, Rocket,
  Shield, CheckCircle2, AlertOctagon, XCircle, Eye, EyeOff, 
  Play, Sparkles, Code, PenLine
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface FileNode {
  name: string;
  type: "directory" | "tsx" | "typescript" | "css";
  path: string;
  size?: number;
  modified?: string;
  children?: FileNode[];
}

export default function AdminSourceEditorTurbo() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  
  // Core state
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set([
    "client/src/pages",
    "client/src/components", 
    "client/src/hooks",
    "client/src/lib"
  ]));
  
  // Dialogs
  const [showBackups, setShowBackups] = useState(false);
  const [showBuildDialog, setShowBuildDialog] = useState(false);
  const [buildOutput, setBuildOutput] = useState("");
  
  // AI State
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"ai" | "health" | "preview">("ai");
  
  // Preview State
  const [showPreview, setShowPreview] = useState(false);
  const [previewCode, setPreviewCode] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  
  // ============ QUERIES ============
  const treeQuery = trpc.admin.sourceCode.getDirectoryTree.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: 3,
    refetchOnWindowFocus: false,
  });
  
  const backupsQuery = trpc.admin.sourceCode.listBackups.useQuery(undefined, {
    enabled: isAuthenticated && showBackups,
  });
  
  const buildStatusQuery = trpc.admin.sourceCode.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });
  
  // Code Health Monitor
  const codeHealthQuery = trpc.admin.dashboard.codeHealth.getErrors.useQuery({ limit: 10 }, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
  const resolveErrorMutation = trpc.admin.dashboard.codeHealth.resolveError.useMutation({
    onSuccess: () => { codeHealthQuery.refetch(); toast.success("Error resolved"); },
  });
  const resolveAllMutation = trpc.admin.dashboard.codeHealth.resolveAll.useMutation({
    onSuccess: () => { codeHealthQuery.refetch(); toast.success("All errors resolved"); },
  });
  
  // File read - using enabled flag
  const [shouldFetchFile, setShouldFetchFile] = useState(false);
  const fileQuery = trpc.admin.sourceCode.readFile.useQuery(
    { filePath: selectedFile || "" },
    { 
      enabled: shouldFetchFile && !!selectedFile && isAuthenticated,
      retry: 2,
    }
  );

  // ============ MUTATIONS ============
  const writeFileMutation = trpc.admin.sourceCode.writeFile.useMutation({
    onSuccess: (data) => {
      setOriginalContent(fileContent);
      toast.success(`Saved ${data.path}`);
    },
    onError: (e) => toast.error(`Save failed: ${e.message}`),
  });

  const buildMutation = trpc.admin.sourceCode.buildAndDeploy.useMutation({
    onSuccess: (data) => {
      setIsBuilding(false);
      setBuildOutput(data.buildOutput || "Build completed successfully!");
      toast.success("Build & deploy completed!");
      buildStatusQuery.refetch();
    },
    onError: (e) => {
      setIsBuilding(false);
      setBuildOutput(`Error: ${e.message}`);
      toast.error(`Build failed: ${e.message}`);
    },
  });

  const aiMutation = trpc.admin.sourceCode.aiAssist.useMutation({
    onSuccess: (data) => {
      setAiResponse(data.result);
      setAiLoading(false);
    },
    onError: (e) => {
      toast.error(e.message);
      setAiLoading(false);
    },
  });

  const restoreBackupMutation = trpc.admin.sourceCode.restoreBackup.useMutation({
    onSuccess: () => {
      toast.success("Backup restored");
      if (selectedFile) {
        setShouldFetchFile(true);
      }
      setShowBackups(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteBackupMutation = trpc.admin.sourceCode.deleteBackup.useMutation({
    onSuccess: () => {
      toast.success("Backup deleted");
      backupsQuery.refetch();
    },
  });

  // ============ EFFECTS ============
  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, isChecking, setLocation]);

  // When file query returns data, update content
  useEffect(() => {
    if (fileQuery.data && shouldFetchFile) {
      setFileContent(fileQuery.data.content);
      setOriginalContent(fileQuery.data.content);
      setShouldFetchFile(false);
    }
  }, [fileQuery.data, shouldFetchFile]);

  // When file is selected, trigger fetch
  useEffect(() => {
    if (selectedFile) {
      setShouldFetchFile(true);
    }
  }, [selectedFile]);

  // ============ HANDLERS ============
  const hasUnsavedChanges = fileContent !== originalContent;

  const handleFileSelect = (filePath: string) => {
    if (hasUnsavedChanges) {
      if (!confirm("You have unsaved changes. Discard them?")) {
        return;
      }
    }
    setFileContent("");
    setOriginalContent("");
    setSelectedFile(filePath);
  };

  const handleSave = async () => {
    if (!selectedFile || !hasUnsavedChanges) return;
    setIsSaving(true);
    try {
      await writeFileMutation.mutateAsync({
        filePath: selectedFile,
        content: fileContent,
        createBackup: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBuild = () => {
    setIsBuilding(true);
    setBuildOutput("");
    buildMutation.mutate();
  };

  const handleAI = (action: string, directEdit = false) => {
    if (!fileContent && action !== "generate") {
      toast.error("No code to analyze");
      return;
    }
    setAiLoading(true);
    setAiResponse("");
    const lang = selectedFile?.endsWith(".css") ? "CSS" : "TypeScript React";
    
    // For direct edit mode, modify the prompt to request only code
    const editPrompt = directEdit 
      ? `${aiPrompt}\n\nIMPORTANT: Return ONLY the complete modified code in a code block. No explanations.`
      : aiPrompt;
    
    aiMutation.mutate({
      action: action as any,
      code: fileContent,
      fileName: selectedFile || undefined,
      language: lang,
      prompt: editPrompt || undefined,
    });
  };

  const applyAICode = () => {
    const codeMatch = aiResponse.match(/```(?:tsx?|javascript|jsx|css)?\n([\s\S]*?)```/);
    if (codeMatch) {
      setPreviewCode(codeMatch[1]); // Set preview first
      setFileContent(codeMatch[1]);
      toast.success("AI code applied to editor");
    } else {
      toast.error("No code block found in response");
    }
  };

  const previewAICode = () => {
    const codeMatch = aiResponse.match(/```(?:tsx?|javascript|jsx|css)?\n([\s\S]*?)```/);
    if (codeMatch) {
      setPreviewCode(codeMatch[1]);
      setRightPanelTab("preview");
      toast.success("Preview updated");
    } else {
      toast.error("No code block found");
    }
  };

  const handleDirectEdit = () => {
    if (!aiPrompt.trim()) {
      toast.error("Enter a command to edit the code");
      return;
    }
    handleAI("edit", true);
  };

  // Generate preview HTML for component
  const generatePreviewHtml = (code: string) => {
    const isCSS = selectedFile?.endsWith(".css");
    if (isCSS) {
      return `<!DOCTYPE html><html><head><style>${code}</style></head><body style="background:#1e1e1e;color:#fff;padding:20px;font-family:system-ui;"><h1>CSS Preview</h1><p>Styles applied to this preview</p><div style="margin-top:20px;padding:20px;border:1px solid #444;border-radius:8px;"><h2>Sample Content</h2><p>This is a paragraph with your styles.</p><button>Sample Button</button><a href="#">Sample Link</a></div></body></html>`;
    }
    // For TSX/React, show syntax-highlighted code (can't actually render React in iframe)
    const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<!DOCTYPE html><html><head><style>body{background:#1e1e1e;color:#e0e0e0;padding:20px;font-family:'Fira Code',monospace;font-size:12px;line-height:1.6;margin:0;}.keyword{color:#569cd6;}.string{color:#ce9178;}.comment{color:#6a9955;}.function{color:#dcdcaa;}.component{color:#4ec9b0;}.prop{color:#9cdcfe;}pre{white-space:pre-wrap;word-wrap:break-word;}</style></head><body><h3 style="color:#f59e0b;margin-bottom:16px;">📄 Component Preview</h3><pre>${escapedCode.replace(/\b(import|export|const|let|var|function|return|if|else|from|default|async|await)\b/g, '<span class="keyword">$1</span>').replace(/(['"\`])(.*?)\1/g, '<span class="string">$1$2$1</span>').replace(/(\/\/.*)/g, '<span class="comment">$1</span>').replace(/\b([A-Z][a-zA-Z0-9]*)\b/g, '<span class="component">$1</span>')}</pre></body></html>`;
  };

  const toggleDir = (dirPath: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(dirPath)) next.delete(dirPath);
      else next.add(dirPath);
      return next;
    });
  };

  // ============ TREE RENDERING ============
  const getIcon = (type: string) => {
    switch (type) {
      case "tsx": return <Braces className="w-4 h-4 text-blue-400" />;
      case "typescript": return <FileCode className="w-4 h-4 text-yellow-400" />;
      case "css": return <Palette className="w-4 h-4 text-pink-400" />;
      case "directory": return <FolderOpen className="w-4 h-4 text-amber-400" />;
      default: return <File className="w-4 h-4 text-stone-400" />;
    }
  };

  const filterNodes = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;
    return nodes.filter(node => {
      if (node.type === "directory") {
        const filtered = filterNodes(node.children || [], query);
        return filtered.length > 0 || node.name.toLowerCase().includes(query.toLowerCase());
      }
      return node.name.toLowerCase().includes(query.toLowerCase());
    }).map(node => {
      if (node.type === "directory") {
        return { ...node, children: filterNodes(node.children || [], query) };
      }
      return node;
    });
  };

  const renderNode = (node: FileNode, depth = 0) => {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = selectedFile === node.path;
    
    return (
      <div key={node.path}>
        <button
          onClick={() => node.type === "directory" ? toggleDir(node.path) : handleFileSelect(node.path)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-all
            ${isSelected ? "bg-amber-600 text-white" : "text-stone-300 hover:bg-stone-700"}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {node.type === "directory" ? (
            isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
          ) : <span className="w-3" />}
          {getIcon(node.type)}
          <span className="truncate flex-1 text-left">{node.name}</span>
        </button>
        {node.type === "directory" && isExpanded && node.children?.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  const filteredTree = useMemo(() => {
    if (!treeQuery.data?.tree) return [];
    return filterNodes(treeQuery.data.tree, searchQuery);
  }, [treeQuery.data?.tree, searchQuery]);

  const stats = useMemo(() => ({
    lines: fileContent.split("\n").length,
    chars: fileContent.length,
  }), [fileContent]);

  // ============ LOADING ============
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-stone-900 flex">
      <AdminSidebar variant="dark" />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-stone-800 border-b border-stone-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-6 h-6 text-amber-500" />
              <div>
                <h1 className="text-lg font-bold text-white">Source Code Editor</h1>
                <p className="text-xs text-stone-400">Edit & deploy live code</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge className="bg-amber-500/20 text-amber-400">Unsaved</Badge>
              )}
              {buildStatusQuery.data?.needsRebuild && (
                <Badge className="bg-green-500/20 text-green-400 animate-pulse">Rebuild needed</Badge>
              )}
              
              <Button
                variant="ghost" size="sm"
                onClick={() => { setShowAI(!showAI); setRightPanelTab("ai"); }}
                className={showAI && rightPanelTab === "ai" ? "bg-purple-600/20 text-purple-400" : "text-stone-400"}
              >
                <Bot className="w-4 h-4 mr-1" /> AI
              </Button>
              
              <Button
                variant="ghost" size="sm"
                onClick={() => { setShowAI(true); setRightPanelTab("health"); }}
                className={`relative ${showAI && rightPanelTab === "health" ? "bg-emerald-600/20 text-emerald-400" : "text-stone-400"}`}
              >
                <Shield className="w-4 h-4 mr-1" /> Health
                {(codeHealthQuery.data?.stats?.unresolved || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                    {codeHealthQuery.data?.stats?.unresolved}
                  </span>
                )}
              </Button>
              
              <Button
                variant="ghost" size="sm"
                onClick={() => { setShowAI(true); setRightPanelTab("preview"); setPreviewCode(fileContent); }}
                className={showAI && rightPanelTab === "preview" ? "bg-blue-600/20 text-blue-400" : "text-stone-400"}
              >
                <Eye className="w-4 h-4 mr-1" /> Preview
              </Button>
              
              <Button
                variant="ghost" size="sm"
                onClick={() => setShowBackups(true)}
                className="text-stone-400 hover:text-white"
              >
                <History className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost" size="sm"
                onClick={() => { treeQuery.refetch(); if (selectedFile) setShouldFetchFile(true); }}
                className="text-stone-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="bg-amber-600 hover:bg-amber-700"
                size="sm"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save
              </Button>
              
              <Button
                onClick={() => setShowBuildDialog(true)}
                disabled={isBuilding}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Rocket className="w-4 h-4 mr-1" />
                Deploy
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Tree */}
          <div className="w-64 bg-stone-800 border-r border-stone-700 flex flex-col">
            <div className="p-2 border-b border-stone-700">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="pl-8 h-8 bg-stone-700 border-stone-600 text-white text-sm"
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2">
                {treeQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-stone-500 animate-spin" />
                  </div>
                ) : treeQuery.isError ? (
                  <div className="text-center py-8 text-red-400 text-sm">
                    Error loading files
                    <Button size="sm" variant="ghost" onClick={() => treeQuery.refetch()} className="mt-2">
                      Retry
                    </Button>
                  </div>
                ) : filteredTree.length === 0 ? (
                  <div className="text-center py-8 text-stone-500 text-sm">
                    No files found
                  </div>
                ) : (
                  filteredTree.map(node => renderNode(node))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col bg-stone-900">
            {selectedFile ? (
              <>
                {/* Tab Bar */}
                <div className="bg-stone-800 border-b border-stone-700 px-3 py-2 flex items-center">
                  <div className="flex items-center gap-2 bg-stone-700 px-3 py-1 rounded text-sm">
                    {getIcon(selectedFile.endsWith(".css") ? "css" : "tsx")}
                    <span className="text-white">{selectedFile.split("/").pop()}</span>
                    {hasUnsavedChanges && <span className="text-amber-400 ml-1">●</span>}
                  </div>
                  <div className="flex-1" />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(fileContent)} className="h-6 px-2 text-stone-400">
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setFileContent(originalContent)} disabled={!hasUnsavedChanges} className="h-6 px-2 text-stone-400">
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Code Editor */}
                <div className="flex-1 overflow-hidden">
                  {fileQuery.isLoading || fileQuery.isFetching ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    </div>
                  ) : (
                    <textarea
                      ref={editorRef}
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      className="w-full h-full bg-stone-900 text-green-400 font-mono text-sm p-4 resize-none outline-none border-none leading-relaxed"
                      spellCheck={false}
                      placeholder="Select a file to edit..."
                      style={{ tabSize: 2 }}
                    />
                  )}
                </div>

                {/* Status Bar */}
                <div className="bg-stone-800 border-t border-stone-700 px-4 py-1 flex items-center justify-between text-xs text-stone-400">
                  <span>{selectedFile}</span>
                  <span>{stats.lines} lines | {stats.chars} chars</span>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-stone-500">
                  <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a file to edit</p>
                  <p className="text-sm mt-1">Choose from the file tree on the left</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - AI / Health / Preview */}
          {showAI && (
            <div className="w-96 bg-stone-800 border-l border-stone-700 flex flex-col">
              {/* Panel Header with Tabs */}
              <Tabs value={rightPanelTab} onValueChange={(v: any) => setRightPanelTab(v)} className="flex flex-col h-full">
                <TabsList className="bg-stone-900 border-b border-stone-700 p-1 rounded-none">
                  <TabsTrigger value="ai" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-stone-400 text-xs">
                    <Bot className="w-3 h-3 mr-1" />AI Editor
                  </TabsTrigger>
                  <TabsTrigger value="health" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-stone-400 text-xs relative">
                    <Shield className="w-3 h-3 mr-1" />Health
                    {(codeHealthQuery.data?.stats?.unresolved || 0) > 0 && (
                      <span className="ml-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                        {codeHealthQuery.data?.stats?.unresolved}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-stone-400 text-xs">
                    <Eye className="w-3 h-3 mr-1" />Preview
                  </TabsTrigger>
                </TabsList>

                {/* AI Tab */}
                <TabsContent value="ai" className="flex-1 flex flex-col m-0 overflow-hidden">
                  {/* AI Command Bar */}
                  <div className="p-3 border-b border-stone-700 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-white">AI Code Editor</span>
                    </div>
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Tell AI what to change... e.g. 'Add a loading spinner' or 'Make the button amber colored'"
                      className="bg-stone-900 border-stone-600 text-white text-sm min-h-[60px] mb-2"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleDirectEdit}
                        disabled={aiLoading || !aiPrompt.trim()}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        size="sm"
                      >
                        <PenLine className="w-4 h-4 mr-1" /> Edit Code
                      </Button>
                      <Button
                        onClick={() => handleAI("chat")}
                        disabled={aiLoading || !aiPrompt.trim()}
                        variant="outline"
                        className="border-stone-600 text-stone-300"
                        size="sm"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="p-2 border-b border-stone-700 grid grid-cols-4 gap-1">
                    {[
                      { action: "explain", icon: FileQuestion, label: "Explain", color: "purple" },
                      { action: "fix", icon: Bug, label: "Fix", color: "red" },
                      { action: "improve", icon: Lightbulb, label: "Improve", color: "green" },
                      { action: "refactor", icon: Wand2, label: "Refactor", color: "blue" },
                    ].map(({ action, icon: Icon, label, color }) => (
                      <Button
                        key={action}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAI(action)}
                        disabled={aiLoading}
                        className={`flex-col h-12 text-stone-400 hover:text-${color}-400 hover:bg-${color}-900/20`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs">{label}</span>
                      </Button>
                    ))}
                  </div>
                  
                  {/* Response */}
                  <ScrollArea className="flex-1 p-3">
                    {aiLoading ? (
                      <div className="flex flex-col items-center py-8">
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin mb-2" />
                        <span className="text-sm text-stone-400">AI is thinking...</span>
                      </div>
                    ) : aiResponse ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Badge className="bg-purple-600/20 text-purple-400">AI Response</Badge>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(aiResponse)} className="h-6 px-2 text-stone-400" title="Copy">
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={previewAICode} className="h-6 px-2 text-blue-400" title="Preview first">
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={applyAICode} className="h-6 px-2 text-emerald-400" title="Apply to editor">
                              <Check className="w-3 h-3" /> Apply
                            </Button>
                          </div>
                        </div>
                        <div className="bg-stone-900 rounded p-3 text-xs text-stone-300 font-mono whitespace-pre-wrap max-h-80 overflow-auto">
                          {aiResponse}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-stone-500">
                        <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Enter a command above</p>
                        <p className="text-xs mt-1">e.g. "Add dark mode support"</p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                {/* Health Tab */}
                <TabsContent value="health" className="flex-1 m-0 p-3 overflow-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Code Health Monitor</span>
                      <Button variant="ghost" size="sm" onClick={() => codeHealthQuery.refetch()} className="h-6 px-2 text-stone-400">
                        <RefreshCw className={`w-3 h-3 ${codeHealthQuery.isFetching ? "animate-spin" : ""}`} />
                      </Button>
                    </div>

                    {/* Status Card */}
                    <Card className={`border ${
                      codeHealthQuery.data?.stats?.status === 'healthy' ? 'bg-emerald-900/20 border-emerald-600/30' :
                      codeHealthQuery.data?.stats?.status === 'warning' ? 'bg-amber-900/20 border-amber-600/30' :
                      'bg-red-900/20 border-red-600/30'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {codeHealthQuery.data?.stats?.status === 'healthy' ? (
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                          ) : codeHealthQuery.data?.stats?.status === 'warning' ? (
                            <AlertTriangle className="w-8 h-8 text-amber-400" />
                          ) : (
                            <AlertOctagon className="w-8 h-8 text-red-400" />
                          )}
                          <div>
                            <p className="font-semibold text-white capitalize">
                              {codeHealthQuery.data?.stats?.status || 'Checking...'}
                            </p>
                            <p className="text-xs text-stone-400">
                              {codeHealthQuery.data?.stats?.unresolved === 0 
                                ? 'No issues detected' 
                                : `${codeHealthQuery.data?.stats?.unresolved} unresolved issue(s)`}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-stone-900 rounded-lg p-3 text-center">
                        <Bug className="w-5 h-5 text-red-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">{codeHealthQuery.data?.stats?.jsErrors || 0}</p>
                        <p className="text-xs text-stone-400">JS Errors</p>
                      </div>
                      <div className="bg-stone-900 rounded-lg p-3 text-center">
                        <XCircle className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">{codeHealthQuery.data?.stats?.apiErrors || 0}</p>
                        <p className="text-xs text-stone-400">API Errors</p>
                      </div>
                    </div>

                    {/* Error List */}
                    {codeHealthQuery.data?.errors && codeHealthQuery.data.errors.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-stone-400">Recent Issues</span>
                          <Button variant="ghost" size="sm" className="h-5 text-xs text-stone-400" onClick={() => resolveAllMutation.mutate()}>
                            Resolve All
                          </Button>
                        </div>
                        {codeHealthQuery.data.errors.map((error: any) => (
                          <div key={error.id} className="bg-stone-900 rounded p-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 mb-1">
                                  <Badge className={`text-[10px] ${error.type === 'js_error' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                    {error.type.replace('_', ' ')}
                                  </Badge>
                                  <span className="text-[10px] text-stone-500">
                                    {formatDistanceToNow(new Date(error.timestamp), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-xs text-white truncate">{error.message}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="h-5 px-1 text-stone-400 hover:text-emerald-400" onClick={() => resolveErrorMutation.mutate({ errorId: error.id })}>
                                <Check className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-stone-500">
                        <Shield className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                        <p className="text-sm">All Clear!</p>
                      </div>
                    )}
                    <p className="text-[10px] text-stone-500 text-center">🔄 Auto-refresh every 30s</p>
                  </div>
                </TabsContent>

                {/* Preview Tab */}
                <TabsContent value="preview" className="flex-1 m-0 flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-stone-700 flex items-center justify-between">
                    <span className="text-xs font-medium text-white">Code Preview</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-stone-400" onClick={() => setPreviewCode(fileContent)}>
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 bg-stone-900">
                    {previewCode ? (
                      <iframe
                        ref={previewRef}
                        srcDoc={generatePreviewHtml(previewCode)}
                        className="w-full h-full border-none"
                        title="Code Preview"
                        sandbox="allow-scripts"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-stone-500">
                        <div className="text-center">
                          <Eye className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No preview available</p>
                          <p className="text-xs mt-1">Edit code or apply AI changes</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t border-stone-700 bg-stone-800">
                    <p className="text-[10px] text-stone-500 text-center">
                      {selectedFile?.endsWith('.css') ? '🎨 Live CSS Preview' : '📄 Syntax-highlighted code view'}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* Build Dialog */}
        <Dialog open={showBuildDialog} onOpenChange={setShowBuildDialog}>
          <DialogContent className="bg-stone-800 border-stone-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-green-500" />
                Build & Deploy
              </DialogTitle>
              <DialogDescription className="text-stone-400">
                Build your code changes and deploy to the live site.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-stone-900 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-400">Last Build:</span>
                  <span>{buildStatusQuery.data?.lastBuild ? formatDistanceToNow(new Date(buildStatusQuery.data.lastBuild), { addSuffix: true }) : "Never"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Status:</span>
                  {buildStatusQuery.data?.needsRebuild ? (
                    <Badge className="bg-amber-500/20 text-amber-400">Needs rebuild</Badge>
                  ) : (
                    <Badge className="bg-green-500/20 text-green-400">Up to date</Badge>
                  )}
                </div>
              </div>
              
              {(isBuilding || buildOutput) && (
                <div className="bg-stone-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2 text-sm text-stone-400">
                    <Terminal className="w-4 h-4" />
                    Output
                  </div>
                  <pre className="text-xs text-green-400 max-h-32 overflow-auto whitespace-pre-wrap">
                    {isBuilding ? "Building... (up to 2 min)" : buildOutput}
                  </pre>
                </div>
              )}
              
              <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">Site will restart briefly during deploy.</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBuildDialog(false)} disabled={isBuilding} className="border-stone-600 text-stone-300">
                Cancel
              </Button>
              <Button onClick={handleBuild} disabled={isBuilding} className="bg-green-600 hover:bg-green-700">
                {isBuilding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Rocket className="w-4 h-4 mr-1" />}
                {isBuilding ? "Building..." : "Deploy Now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Backups Dialog */}
        <Dialog open={showBackups} onOpenChange={setShowBackups}>
          <DialogContent className="bg-stone-800 border-stone-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                Code Backups
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-80">
              {backupsQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-stone-500 animate-spin" />
                </div>
              ) : !backupsQuery.data?.backups.length ? (
                <div className="text-center py-8 text-stone-500">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No backups yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {backupsQuery.data.backups.map((backup) => (
                    <div key={backup.name} className="p-3 bg-stone-700/50 rounded flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-stone-400" />
                          <span className="font-medium">{backup.originalFile}</span>
                        </div>
                        <div className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(backup.created), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const targetPath = selectedFile || prompt(`Enter restore path (e.g., client/src/pages/${backup.originalFile}):`);
                            if (targetPath) {
                              restoreBackupMutation.mutate({ 
                                backupName: backup.name, 
                                targetPath 
                              });
                            }
                          }}
                          className="text-amber-400 hover:bg-stone-600"
                          title={selectedFile ? `Restore to ${selectedFile}` : "Restore backup"}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteBackupMutation.mutate({ backupName: backup.name })}
                          className="text-red-400 hover:bg-stone-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBackups(false)} className="border-stone-600 text-stone-300">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
