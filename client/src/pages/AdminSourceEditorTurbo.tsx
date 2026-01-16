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
  Lightbulb, PanelRightOpen, PanelRightClose, Check, Rocket
} from "lucide-react";
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
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  
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

  const handleAI = (action: string) => {
    if (!fileContent && action !== "generate") {
      toast.error("No code to analyze");
      return;
    }
    setAiLoading(true);
    setAiResponse("");
    const lang = selectedFile?.endsWith(".css") ? "CSS" : "TypeScript React";
    aiMutation.mutate({
      action: action as any,
      code: fileContent,
      fileName: selectedFile || undefined,
      language: lang,
      prompt: aiPrompt || undefined,
    });
  };

  const applyAICode = () => {
    const codeMatch = aiResponse.match(/```(?:tsx?|javascript|css)?\n([\s\S]*?)```/);
    if (codeMatch) {
      setFileContent(codeMatch[1]);
      toast.success("AI code applied");
    } else {
      toast.error("No code block found");
    }
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
                onClick={() => setShowAI(!showAI)}
                className={showAI ? "bg-purple-600/20 text-purple-400" : "text-stone-400"}
              >
                <Bot className="w-4 h-4 mr-1" /> AI
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

          {/* AI Panel */}
          {showAI && (
            <div className="w-80 bg-stone-800 border-l border-stone-700 flex flex-col">
              <div className="p-3 border-b border-stone-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-400" />
                  <span className="font-medium text-white">Gemini AI</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setAiResponse("")} className="h-6 px-2 text-stone-400">
                  <RotateCcw className="w-3 h-3" />
                </Button>
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
                    <span className="text-sm text-stone-400">Thinking...</span>
                  </div>
                ) : aiResponse ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Badge className="bg-purple-600/20 text-purple-400">Response</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(aiResponse)} className="h-6 px-2 text-stone-400">
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={applyAICode} className="h-6 px-2 text-purple-400">
                          <Check className="w-3 h-3" /> Apply
                        </Button>
                      </div>
                    </div>
                    <div className="bg-stone-900 rounded p-3 text-xs text-stone-300 font-mono whitespace-pre-wrap max-h-64 overflow-auto">
                      {aiResponse}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-stone-500">
                    <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Ask AI about your code</p>
                  </div>
                )}
              </ScrollArea>
              
              {/* Chat Input */}
              <div className="p-3 border-t border-stone-700">
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask about this code..."
                  className="bg-stone-900 border-stone-600 text-white text-sm min-h-[60px] mb-2"
                />
                <Button
                  onClick={() => handleAI("chat")}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-1" /> Send
                </Button>
              </div>
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
                          onClick={() => restoreBackupMutation.mutate({ 
                            backupName: backup.name, 
                            targetPath: `client/src/pages/${backup.originalFile}` 
                          })}
                          className="text-amber-400 hover:bg-stone-600"
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
