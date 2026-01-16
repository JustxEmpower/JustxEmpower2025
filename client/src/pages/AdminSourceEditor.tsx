import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import AdminSidebar from '@/components/AdminSidebar';
import { motion, AnimatePresence } from "framer-motion";
import {
  Code, Save, Loader2, RefreshCw, FileCode, Sparkles, Copy, Check,
  Eye, EyeOff, History, Undo2, Download, Upload, Trash2,
  AlertTriangle, CheckCircle, XCircle, Zap, Terminal, Palette,
  ChevronDown, ChevronRight, Plus, Settings, FolderOpen, File,
  Search, X, RotateCcw, GitBranch, Clock, FileText, Braces,
  Bot, Send, Wand2, Bug, MessageSquare, FileQuestion, TestTube,
  Lightbulb, PanelRightOpen, PanelRightClose
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface FileNode {
  name: string;
  type: "directory" | "tsx" | "typescript" | "css";
  path: string;
  size?: number;
  modified?: string;
  children?: FileNode[];
}

interface BackupFile {
  name: string;
  originalFile: string;
  timestamp: string;
  size: number;
  created: string;
}

export default function AdminSourceEditor() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(["client/src/pages", "client/src/components"]));
  const [showBackups, setShowBackups] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // AI Assistant State
  const [showAI, setShowAI] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [selectedText, setSelectedText] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [showBuildDialog, setShowBuildDialog] = useState(false);
  const [buildOutput, setBuildOutput] = useState("");
  
  // Queries
  const treeQuery = trpc.admin.sourceCode.getDirectoryTree.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const backupsQuery = trpc.admin.sourceCode.listBackups.useQuery(undefined, {
    enabled: isAuthenticated && showBackups,
  });
  
  const fileQuery = trpc.admin.sourceCode.readFile.useQuery(
    { filePath: selectedFile || "" },
    { enabled: !!selectedFile && isAuthenticated }
  );

  // Mutations
  const writeFileMutation = trpc.admin.sourceCode.writeFile.useMutation({
    onSuccess: (data) => {
      setOriginalContent(fileContent);
      toast.success(`Saved ${data.path} (${data.lines} lines)`);
      backupsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const restoreBackupMutation = trpc.admin.sourceCode.restoreBackup.useMutation({
    onSuccess: (data) => {
      toast.success(`Restored ${data.restored}`);
      if (selectedFile) {
        fileQuery.refetch();
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
    onError: (e) => toast.error(e.message),
  });

  // Build Status Query
  const buildStatusQuery = trpc.admin.sourceCode.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Build and Deploy Mutation
  const buildMutation = trpc.admin.sourceCode.buildAndDeploy.useMutation({
    onSuccess: (data) => {
      setIsBuilding(false);
      setBuildOutput(data.buildOutput || "Build completed");
      toast.success("Build & deploy completed!");
      buildStatusQuery.refetch();
    },
    onError: (e) => {
      setIsBuilding(false);
      setBuildOutput(`Error: ${e.message}`);
      toast.error(e.message);
    },
  });

  // AI Assistant Mutation
  const aiAssistMutation = trpc.admin.sourceCode.aiAssist.useMutation({
    onSuccess: (data) => {
      setAiResponse(data.result);
      setAiLoading(false);
    },
    onError: (e) => {
      toast.error(e.message);
      setAiLoading(false);
    },
  });

  // Load file content when selected
  useEffect(() => {
    if (fileQuery.data) {
      setFileContent(fileQuery.data.content);
      setOriginalContent(fileQuery.data.content);
    }
  }, [fileQuery.data]);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  // Check for unsaved changes
  const hasUnsavedChanges = fileContent !== originalContent;

  // Handle file selection
  const handleFileSelect = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingFile(path);
      setShowUnsavedDialog(true);
    } else {
      setSelectedFile(path);
    }
  };

  // Discard changes and switch
  const discardAndSwitch = () => {
    if (pendingFile) {
      setSelectedFile(pendingFile);
      setPendingFile(null);
    }
    setShowUnsavedDialog(false);
  };

  // Save file
  const handleSave = async () => {
    if (!selectedFile) return;
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

  // Copy to clipboard
  const copyCode = () => {
    navigator.clipboard.writeText(fileContent);
    toast.success("Copied to clipboard");
  };

  // Revert changes
  const revertChanges = () => {
    setFileContent(originalContent);
    toast.info("Changes reverted");
  };

  // AI Assistant Actions
  const handleAIAction = async (action: "explain" | "fix" | "improve" | "generate" | "refactor" | "comment" | "test" | "chat", prompt?: string) => {
    if (!fileContent && action !== "generate") {
      toast.error("No code to analyze");
      return;
    }
    
    setAiLoading(true);
    setAiResponse("");
    
    const lang = selectedFile?.endsWith(".css") ? "CSS" : selectedFile?.endsWith(".ts") ? "TypeScript" : "TypeScript React";
    
    aiAssistMutation.mutate({
      action,
      code: fileContent,
      fileName: selectedFile || undefined,
      language: lang,
      selection: selectedText || undefined,
      prompt: prompt || aiPrompt,
      conversationHistory: action === "chat" ? aiHistory : undefined,
    });

    if (action === "chat" && (prompt || aiPrompt)) {
      setAiHistory(prev => [...prev, { role: "user", content: prompt || aiPrompt }]);
      setAiPrompt("");
    }
  };

  // Apply AI generated code
  const applyAICode = () => {
    // Extract code blocks from AI response
    const codeBlockRegex = /```(?:tsx?|javascript|css)?\n([\s\S]*?)```/g;
    const matches = [...aiResponse.matchAll(codeBlockRegex)];
    
    if (matches.length > 0) {
      const extractedCode = matches.map(m => m[1]).join("\n\n");
      setFileContent(extractedCode);
      toast.success("AI code applied");
    } else {
      toast.error("No code block found in AI response");
    }
  };

  // Copy AI response
  const copyAIResponse = () => {
    navigator.clipboard.writeText(aiResponse);
    toast.success("Copied to clipboard");
  };

  // Handle text selection for AI context
  const handleTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start !== end) {
        setSelectedText(textareaRef.current.value.substring(start, end));
      } else {
        setSelectedText("");
      }
    }
  };

  // Toggle directory
  const toggleDir = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Track cursor position
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFileContent(e.target.value);
    updateCursorPosition(e.target);
  };

  const updateCursorPosition = (textarea: HTMLTextAreaElement) => {
    const pos = textarea.selectionStart;
    const lines = textarea.value.substring(0, pos).split("\n");
    setCursorPosition({ line: lines.length, col: lines[lines.length - 1].length + 1 });
  };

  // Filter tree by search
  const filterTree = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;
    return nodes
      .map(node => {
        if (node.type === "directory") {
          const filteredChildren = filterTree(node.children || [], query);
          if (filteredChildren.length > 0 || node.name.toLowerCase().includes(query.toLowerCase())) {
            return { ...node, children: filteredChildren };
          }
          return null;
        }
        return node.name.toLowerCase().includes(query.toLowerCase()) ? node : null;
      })
      .filter(Boolean) as FileNode[];
  };

  // Get file icon
  const getFileIcon = (type: string) => {
    switch (type) {
      case "tsx": return <Braces className="w-4 h-4 text-blue-500" />;
      case "typescript": return <FileCode className="w-4 h-4 text-blue-400" />;
      case "css": return <Palette className="w-4 h-4 text-pink-500" />;
      case "directory": return <FolderOpen className="w-4 h-4 text-amber-500" />;
      default: return <File className="w-4 h-4 text-stone-400" />;
    }
  };

  // Render file tree
  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.path}>
        <button
          onClick={() => node.type === "directory" ? toggleDir(node.path) : handleFileSelect(node.path)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-stone-100 rounded transition-colors ${
            selectedFile === node.path ? "bg-amber-100 text-amber-900" : "text-stone-700"
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {node.type === "directory" ? (
            expandedDirs.has(node.path) ? (
              <ChevronDown className="w-3 h-3 text-stone-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-stone-400" />
            )
          ) : (
            <span className="w-3" />
          )}
          {getFileIcon(node.type)}
          <span className="truncate flex-1 text-left">{node.name}</span>
          {node.size && (
            <span className="text-xs text-stone-400">{Math.round(node.size / 1024)}kb</span>
          )}
        </button>
        {node.type === "directory" && expandedDirs.has(node.path) && node.children && (
          <div>{renderTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  // Stats
  const stats = useMemo(() => {
    const lines = fileContent.split("\n");
    return {
      lines: lines.length,
      chars: fileContent.length,
      words: fileContent.split(/\s+/).filter(w => w).length,
    };
  }, [fileContent]);

  // Filtered tree
  const filteredTree = useMemo(() => {
    if (!treeQuery.data?.tree) return [];
    return filterTree(treeQuery.data.tree, searchQuery);
  }, [treeQuery.data?.tree, searchQuery]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex">
      <AdminSidebar variant="dark" />
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-stone-800/80 backdrop-blur-lg border-b border-stone-700">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="w-6 h-6 text-amber-500" />
                <div>
                  <h1 className="text-lg font-bold text-white">Source Code Editor</h1>
                  <p className="text-stone-400 text-xs">Edit page source files directly</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    Unsaved changes
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBackups(true)}
                  className="text-stone-300 hover:text-white hover:bg-stone-700"
                >
                  <History className="w-4 h-4 mr-2" />
                  Backups
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => treeQuery.refetch()}
                  className="text-stone-300 hover:text-white hover:bg-stone-700"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAI(!showAI)}
                  className={`${showAI ? "bg-purple-600/20 text-purple-400" : "text-stone-300"} hover:text-white hover:bg-stone-700`}
                >
                  {showAI ? <PanelRightClose className="w-4 h-4 mr-2" /> : <PanelRightOpen className="w-4 h-4 mr-2" />}
                  AI
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges || !selectedFile}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  size="sm"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setShowBuildDialog(true);
                    setBuildOutput("");
                  }}
                  disabled={isBuilding}
                  className={`${buildStatusQuery.data?.needsRebuild ? "bg-green-600 hover:bg-green-700" : "bg-stone-600 hover:bg-stone-500"} text-white`}
                  size="sm"
                >
                  {isBuilding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  Deploy
                  {buildStatusQuery.data?.needsRebuild && <span className="ml-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer */}
          <div className="w-64 bg-stone-800 border-r border-stone-700 flex flex-col">
            <div className="p-2 border-b border-stone-700">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="pl-8 bg-stone-700 border-stone-600 text-white placeholder:text-stone-500 h-8 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-stone-500 hover:text-white" />
                  </button>
                )}
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {treeQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-stone-500 animate-spin" />
                  </div>
                ) : (
                  renderTree(filteredTree)
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Editor */}
          <div className={`${showAI ? "flex-1" : "flex-1"} flex flex-col bg-stone-900`}>
            {selectedFile ? (
              <>
                {/* File Tab */}
                <div className="bg-stone-800 border-b border-stone-700 px-2 py-1 flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-700 rounded-t text-sm">
                    {getFileIcon(selectedFile.endsWith(".css") ? "css" : selectedFile.endsWith(".ts") ? "typescript" : "tsx")}
                    <span className="text-white">{selectedFile.split("/").pop()}</span>
                    {hasUnsavedChanges && <span className="text-amber-400">●</span>}
                    <button onClick={() => { setSelectedFile(null); setFileContent(""); setOriginalContent(""); }}>
                      <X className="w-3 h-3 text-stone-400 hover:text-white" />
                    </button>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={copyCode} className="text-stone-400 hover:text-white h-7 px-2">
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={revertChanges}
                      disabled={!hasUnsavedChanges}
                      className="text-stone-400 hover:text-white h-7 px-2"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Code Editor */}
                <div className="flex-1 relative">
                  {fileQuery.isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex">
                      {/* Line Numbers */}
                      <div className="w-12 bg-stone-800 border-r border-stone-700 overflow-hidden">
                        <div className="py-2 px-2 font-mono text-xs text-stone-500 text-right leading-6">
                          {fileContent.split("\n").map((_, i) => (
                            <div key={i}>{i + 1}</div>
                          ))}
                        </div>
                      </div>
                      {/* Code Area */}
                      <textarea
                        ref={textareaRef}
                        value={fileContent}
                        onChange={handleTextareaChange}
                        onSelect={(e) => { updateCursorPosition(e.currentTarget); handleTextSelection(); }}
                        onClick={(e) => updateCursorPosition(e.currentTarget)}
                        onKeyUp={(e) => { updateCursorPosition(e.currentTarget); handleTextSelection(); }}
                        className="flex-1 bg-stone-900 text-green-400 font-mono text-sm p-2 leading-6 resize-none outline-none"
                        spellCheck={false}
                        style={{ tabSize: 2 }}
                      />
                    </div>
                  )}
                </div>

                {/* Status Bar */}
                <div className="bg-stone-800 border-t border-stone-700 px-4 py-1 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-stone-400">
                    <span>{selectedFile}</span>
                    <span>|</span>
                    <span>{stats.lines} lines</span>
                    <span>{stats.chars} chars</span>
                    {selectedText && <Badge className="bg-purple-600/20 text-purple-400 text-xs">{selectedText.length} selected</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-stone-400">
                    <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
                    <span>UTF-8</span>
                    <span>{selectedFile.endsWith(".css") ? "CSS" : selectedFile.endsWith(".ts") ? "TypeScript" : "TypeScript React"}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-stone-500">
                <div className="text-center">
                  <FileCode className="w-16 h-16 mx-auto mb-4 text-stone-600" />
                  <p className="text-lg font-medium">Select a file to edit</p>
                  <p className="text-sm mt-1">Choose from the file explorer on the left</p>
                </div>
              </div>
            )}
          </div>

          {/* AI Assistant Panel */}
          {showAI && (
            <div className="w-96 bg-stone-800 border-l border-stone-700 flex flex-col">
              {/* AI Header */}
              <div className="p-3 border-b border-stone-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-white">Gemini AI Assistant</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setAiResponse(""); setAiHistory([]); }}
                    className="text-stone-400 hover:text-white h-6 px-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-3 border-b border-stone-700">
                <p className="text-xs text-stone-500 mb-2">Quick Actions</p>
                <div className="grid grid-cols-4 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIAction("explain")}
                    disabled={aiLoading || !selectedFile}
                    className="flex-col h-14 text-stone-400 hover:text-purple-400 hover:bg-purple-900/20"
                  >
                    <FileQuestion className="w-4 h-4 mb-1" />
                    <span className="text-xs">Explain</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIAction("fix")}
                    disabled={aiLoading || !selectedFile}
                    className="flex-col h-14 text-stone-400 hover:text-red-400 hover:bg-red-900/20"
                  >
                    <Bug className="w-4 h-4 mb-1" />
                    <span className="text-xs">Fix</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIAction("improve")}
                    disabled={aiLoading || !selectedFile}
                    className="flex-col h-14 text-stone-400 hover:text-green-400 hover:bg-green-900/20"
                  >
                    <Lightbulb className="w-4 h-4 mb-1" />
                    <span className="text-xs">Improve</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIAction("refactor")}
                    disabled={aiLoading || !selectedFile}
                    className="flex-col h-14 text-stone-400 hover:text-blue-400 hover:bg-blue-900/20"
                  >
                    <Wand2 className="w-4 h-4 mb-1" />
                    <span className="text-xs">Refactor</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIAction("comment")}
                    disabled={aiLoading || !selectedFile}
                    className="flex-col h-14 text-stone-400 hover:text-amber-400 hover:bg-amber-900/20"
                  >
                    <MessageSquare className="w-4 h-4 mb-1" />
                    <span className="text-xs">Comment</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIAction("test")}
                    disabled={aiLoading || !selectedFile}
                    className="flex-col h-14 text-stone-400 hover:text-cyan-400 hover:bg-cyan-900/20"
                  >
                    <TestTube className="w-4 h-4 mb-1" />
                    <span className="text-xs">Test</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIAction("generate")}
                    disabled={aiLoading}
                    className="flex-col h-14 text-stone-400 hover:text-pink-400 hover:bg-pink-900/20"
                  >
                    <Sparkles className="w-4 h-4 mb-1" />
                    <span className="text-xs">Generate</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {}}
                    disabled={aiLoading}
                    className="flex-col h-14 text-stone-400 hover:text-purple-400 hover:bg-purple-900/20"
                  >
                    <Bot className="w-4 h-4 mb-1" />
                    <span className="text-xs">Chat</span>
                  </Button>
                </div>
              </div>

              {/* AI Response */}
              <ScrollArea className="flex-1 p-3">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                    <p className="text-stone-400 text-sm">Gemini is thinking...</p>
                  </div>
                ) : aiResponse ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-purple-600/20 text-purple-400">AI Response</Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyAIResponse}
                          className="h-6 px-2 text-stone-400 hover:text-white"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={applyAICode}
                          className="h-6 px-2 text-purple-400 hover:text-purple-300"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Apply
                        </Button>
                      </div>
                    </div>
                    <div className="bg-stone-900 rounded-lg p-3 text-sm text-stone-300 whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-96 overflow-auto">
                      {aiResponse}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-stone-500">
                    <Bot className="w-12 h-12 mb-3 text-stone-600" />
                    <p className="text-sm">Ask Gemini anything about your code</p>
                    <p className="text-xs mt-1">Use quick actions or chat below</p>
                  </div>
                )}
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-3 border-t border-stone-700">
                <div className="flex gap-2">
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ask about this code..."
                    className="flex-1 bg-stone-900 border-stone-600 text-white placeholder:text-stone-500 text-sm min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (aiPrompt.trim()) handleAIAction("chat");
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={() => handleAIAction("chat")}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="w-full mt-2 bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send to Gemini
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Unsaved Changes Dialog */}
        <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <DialogContent className="bg-stone-800 border-stone-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Unsaved Changes
              </DialogTitle>
              <DialogDescription className="text-stone-400">
                You have unsaved changes in the current file. Do you want to save before switching?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={discardAndSwitch} className="text-stone-400 hover:text-white hover:bg-stone-700">
                Don't Save
              </Button>
              <Button onClick={() => setShowUnsavedDialog(false)} variant="outline" className="border-stone-600 text-stone-300">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await handleSave();
                  discardAndSwitch();
                }}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Save & Switch
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Backups Dialog */}
        <Dialog open={showBackups} onOpenChange={setShowBackups}>
          <DialogContent className="max-w-2xl bg-stone-800 border-stone-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                Code Backups
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              {backupsQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                </div>
              ) : backupsQuery.data?.backups.length === 0 ? (
                <div className="py-8 text-center text-stone-500">
                  <History className="w-12 h-12 mx-auto mb-3 text-stone-600" />
                  <p>No backups yet</p>
                  <p className="text-sm">Backups are created automatically when you save</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {backupsQuery.data?.backups.map((backup) => (
                    <div
                      key={backup.name}
                      className="p-3 bg-stone-700/50 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-stone-400" />
                          <span className="font-medium">{backup.originalFile}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(backup.created), { addSuffix: true })}
                          <span>•</span>
                          {Math.round(backup.size / 1024)}kb
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const targetPath = `client/src/pages/${backup.originalFile}`;
                            restoreBackupMutation.mutate({ backupName: backup.name, targetPath });
                          }}
                          className="text-amber-400 hover:text-amber-300 hover:bg-stone-600"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteBackupMutation.mutate({ backupName: backup.name })}
                          className="text-red-400 hover:text-red-300 hover:bg-stone-600"
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

        {/* Build & Deploy Dialog */}
        <Dialog open={showBuildDialog} onOpenChange={setShowBuildDialog}>
          <DialogContent className="max-w-lg bg-stone-800 border-stone-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-500" />
                Build & Deploy
              </DialogTitle>
              <DialogDescription className="text-stone-400">
                Build your changes and deploy them to the live site.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Build Status */}
              <div className="bg-stone-900 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-400">Last Build:</span>
                  <span className="text-stone-300">
                    {buildStatusQuery.data?.lastBuild 
                      ? formatDistanceToNow(new Date(buildStatusQuery.data.lastBuild), { addSuffix: true })
                      : "Never"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-400">Latest Code Change:</span>
                  <span className="text-stone-300">
                    {buildStatusQuery.data?.latestSourceChange
                      ? formatDistanceToNow(new Date(buildStatusQuery.data.latestSourceChange), { addSuffix: true })
                      : "Unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-400">Status:</span>
                  {buildStatusQuery.data?.needsRebuild ? (
                    <Badge className="bg-amber-500/20 text-amber-400">Rebuild needed</Badge>
                  ) : (
                    <Badge className="bg-green-500/20 text-green-400">Up to date</Badge>
                  )}
                </div>
              </div>

              {/* Build Output */}
              {(isBuilding || buildOutput) && (
                <div className="bg-stone-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="w-4 h-4 text-stone-400" />
                    <span className="text-sm text-stone-400">Build Output</span>
                  </div>
                  <div className="font-mono text-xs text-green-400 max-h-32 overflow-auto whitespace-pre-wrap">
                    {isBuilding ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Building... This may take up to 2 minutes.
                      </div>
                    ) : (
                      buildOutput
                    )}
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-300">
                  Building will temporarily restart the server. The site will be unavailable for a few seconds during deployment.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowBuildDialog(false)} 
                className="border-stone-600 text-stone-300"
                disabled={isBuilding}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setIsBuilding(true);
                  setBuildOutput("");
                  buildMutation.mutate();
                }}
                disabled={isBuilding}
                className="bg-green-600 hover:bg-green-700"
              >
                {isBuilding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Building...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Build & Deploy Now
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
