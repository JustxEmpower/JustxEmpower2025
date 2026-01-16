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
  Search, X, RotateCcw, GitBranch, Clock, FileText, Braces
} from "lucide-react";
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
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges || !selectedFile}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  size="sm"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
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
          <div className="flex-1 flex flex-col bg-stone-900">
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
                        onSelect={(e) => updateCursorPosition(e.currentTarget)}
                        onClick={(e) => updateCursorPosition(e.currentTarget)}
                        onKeyUp={(e) => updateCursorPosition(e.currentTarget)}
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
      </main>
    </div>
  );
}
