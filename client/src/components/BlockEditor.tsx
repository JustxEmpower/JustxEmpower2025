import React, { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Edit,
  Trash2,
  Type,
  Image as ImageIcon,
  Video,
  Quote,
  MousePointerClick,
  Space,
  Download,
  Upload,
  Copy,
  Undo,
  Redo,
  Search,
  X,
  Eye,
  EyeOff,
  Library,
  Save,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import MediaPicker from "@/components/MediaPicker";
import BlockPreview from "@/components/BlockPreview";
import { BlockHistory } from "@/components/BlockHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisibilitySettings } from "@/components/VisibilitySettings";
import { AnimationSettings } from "@/components/AnimationSettings";

interface PageBlock {
  id: number;
  pageId: number;
  type: "text" | "image" | "video" | "quote" | "cta" | "spacer";
  content: string | null;
  settings: string | null;
  visibility: string | null;
  animation: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface BlockEditorProps {
  pageId: number;
  pageName: string;
}

interface SortableBlockProps {
  block: PageBlock;
  onEdit: (block: PageBlock) => void;
  onDelete: (id: number) => void;
  onDuplicate: (block: PageBlock) => void;
  onViewHistory: (blockId: number) => void;
}

function SortableBlock({ block, onEdit, onDelete, onDuplicate, onViewHistory }: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const blockIcons = {
    text: Type,
    image: ImageIcon,
    video: Video,
    quote: Quote,
    cta: MousePointerClick,
    spacer: Space,
  };

  const Icon = blockIcons[block.type];

  const getBlockPreview = () => {
    const content = block.content || "";
    switch (block.type) {
      case "text":
        return content.substring(0, 100) + (content.length > 100 ? "..." : "");
      case "image":
        return content ? <img src={content} alt="Block preview" className="h-12 w-auto rounded" /> : "No image";
      case "video":
        return `Video: ${content}`;
      case "quote":
        return `"${content.substring(0, 80)}..."`;
      case "cta":
        return `CTA: ${content}`;
      case "spacer":
        const settings = JSON.parse(block.settings || "{}");
        return `Spacer (${settings.height || "medium"})`;
      default:
        return content;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 flex-1">
        <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
          <Icon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 capitalize">
            {block.type}
          </p>
          <p className="text-xs text-neutral-500 truncate">{getBlockPreview()}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={() => onEdit(block)} variant="outline" size="sm">
          <Edit className="w-4 h-4" />
        </Button>

        <Button onClick={() => onDuplicate(block)} variant="outline" size="sm">
          <Copy className="w-4 h-4" />
        </Button>

        <Button onClick={() => onViewHistory(block.id)} variant="outline" size="sm" title="View History">
          <Clock className="w-4 h-4" />
        </Button>

        <Button
          onClick={() => onDelete(block.id)}
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function BlockEditor({ pageId, pageName }: BlockEditorProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<PageBlock | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "text" as PageBlock["type"],
    content: "",
    settings: "{}",
    visibility: "{}",
    animation: "{}",
  });
  const [history, setHistory] = useState<PageBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<PageBlock["type"] | "all">("all");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyBlockId, setHistoryBlockId] = useState<number | null>(null);

  const blocksQuery = trpc.admin.pages.blocks.list.useQuery({ pageId });
  const createMutation = trpc.admin.pages.blocks.create.useMutation();
  const updateMutation = trpc.admin.pages.blocks.update.useMutation();
  const deleteMutation = trpc.admin.pages.blocks.delete.useMutation();
  const reorderMutation = trpc.admin.pages.blocks.reorder.useMutation();
  
  const templatesQuery = trpc.admin.blockTemplates.list.useQuery();
  const createTemplateMutation = trpc.admin.blockTemplates.create.useMutation();
  const deleteTemplateMutation = trpc.admin.blockTemplates.delete.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const allBlocks = blocksQuery.data || [];

  // Filter blocks based on search query and filter type
  const blocks = useMemo(() => {
    let filtered = allBlocks;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((block) => block.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((block) => {
        const content = (block.content || "").toLowerCase();
        const type = block.type.toLowerCase();
        const settings = (block.settings || "").toLowerCase();
        return content.includes(query) || type.includes(query) || settings.includes(query);
      });
    }

    return filtered;
  }, [allBlocks, searchQuery, filterType]);

  // Save history snapshot when blocks change
  useEffect(() => {
    if (blocks.length > 0 || history.length === 0) {
      const snapshot = JSON.parse(JSON.stringify(blocks));
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(snapshot);
        // Limit history to 50 snapshots
        if (newHistory.length > 50) {
          newHistory.shift();
          return newHistory;
        }
        return newHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    }
  }, [blocks.length, blocks.map(b => `${b.id}-${b.order}-${b.content}`).join(',')]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z for redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, historyIndex]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);

      const reorderedBlocks = arrayMove(blocks, oldIndex, newIndex);
      const blockOrders = reorderedBlocks.map((block, index) => ({
        id: block.id,
        order: index,
      }));

      try {
        await reorderMutation.mutateAsync({ blocks: blockOrders });
        blocksQuery.refetch();
      } catch (error) {
        toast.error("Failed to reorder blocks");
        console.error(error);
      }
    }
  };

  const handleCreateBlock = async () => {
    try {
      await createMutation.mutateAsync({
        pageId,
        type: formData.type,
        content: formData.content,
        settings: formData.settings,
        visibility: formData.visibility,
        animation: formData.animation,
        order: blocks.length,
      });
      toast.success("Block added successfully");
      setIsAddDialogOpen(false);
      setFormData({ type: "text", content: "", settings: "{}", visibility: "{}", animation: "{}" });
      blocksQuery.refetch();
    } catch (error) {
      toast.error("Failed to add block");
      console.error(error);
    }
  };

  const handleUpdateBlock = async () => {
    if (!editingBlock) return;

    try {
      await updateMutation.mutateAsync({
        id: editingBlock.id,
        content: formData.content,
        settings: formData.settings,
        visibility: formData.visibility,
        animation: formData.animation,
      });
      toast.success("Block updated successfully");
      setIsEditDialogOpen(false);
      setEditingBlock(null);
      setFormData({ type: "text", content: "", settings: "{}", visibility: "{}", animation: "{}" });
    } catch (error) {
      toast.error("Failed to update block");
      console.error(error);
    }
  };

  const handleExportLayout = () => {
    try {
      const exportData = {
        version: "1.0",
        pageName,
        blocks: blocks.map((block) => ({
          type: block.type,
          content: block.content,
          settings: block.settings,
        })),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pageName.replace(/\s+/g, "-").toLowerCase()}-layout-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Layout exported successfully");
    } catch (error) {
      toast.error("Failed to export layout");
      console.error(error);
    }
  };

  const handleImportLayout = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate import data
      if (!importData.version || !importData.blocks || !Array.isArray(importData.blocks)) {
        throw new Error("Invalid layout file format");
      }

      // Import blocks
      let currentOrder = blocks.length;
      for (const block of importData.blocks) {
        await createMutation.mutateAsync({
          pageId,
          type: block.type,
          content: block.content || "",
          settings: block.settings || "{}",
          order: currentOrder++,
        });
      }

      toast.success(`Imported ${importData.blocks.length} blocks successfully`);
      event.target.value = ""; // Reset file input
    } catch (error) {
      toast.error("Failed to import layout. Please check the file format.");
      console.error(error);
      event.target.value = ""; // Reset file input
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    try {
      const templateBlocks = allBlocks.map((block) => ({
        type: block.type,
        content: block.content,
        settings: block.settings,
      }));

      await createTemplateMutation.mutateAsync({
        name: templateName,
        description: templateDescription || undefined,
        blocks: JSON.stringify(templateBlocks),
      });

      toast.success("Template saved successfully");
      setIsSaveTemplateOpen(false);
      setTemplateName("");
      setTemplateDescription("");
      await templatesQuery.refetch();
    } catch (error) {
      toast.error("Failed to save template");
      console.error(error);
    }
  };

  const handleLoadTemplate = async (templateBlocks: string) => {
    try {
      const blocks = JSON.parse(templateBlocks);
      let currentOrder = allBlocks.length;

      for (const block of blocks) {
        await createMutation.mutateAsync({
          pageId,
          type: block.type,
          content: block.content || "",
          settings: block.settings || "{}",
          order: currentOrder++,
        });
      }

      toast.success(`Loaded ${blocks.length} blocks from template`);
      setIsTemplateLibraryOpen(false);
    } catch (error) {
      toast.error("Failed to load template");
      console.error(error);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      await deleteTemplateMutation.mutateAsync({ id });
      toast.success("Template deleted successfully");
      await templatesQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete template");
      console.error(error);
    }
  };

  const handleUndo = async () => {
    if (!canUndo) return;

    try {
      const targetIndex = historyIndex - 1;
      const targetSnapshot = history[targetIndex];
      
      // Delete blocks that don't exist in target snapshot
      const targetIds = new Set(targetSnapshot.map(b => b.id));
      for (const block of blocks) {
        if (!targetIds.has(block.id)) {
          await deleteMutation.mutateAsync({ id: block.id });
        }
      }

      // Create or update blocks from target snapshot
      for (const targetBlock of targetSnapshot) {
        const existingBlock = blocks.find(b => b.id === targetBlock.id);
        if (!existingBlock) {
          await createMutation.mutateAsync({
            pageId,
            type: targetBlock.type,
            content: targetBlock.content || "",
            settings: targetBlock.settings || "{}",
            order: targetBlock.order,
          });
        } else if (
          existingBlock.content !== targetBlock.content ||
          existingBlock.settings !== targetBlock.settings ||
          existingBlock.order !== targetBlock.order
        ) {
          await updateMutation.mutateAsync({
            id: targetBlock.id,
            content: targetBlock.content || "",
            settings: targetBlock.settings || "{}",
          });
        }
      }

      // Reorder if needed
      const blockOrders = targetSnapshot.map((block, index) => ({
        id: block.id,
        order: index,
      }));
      await reorderMutation.mutateAsync({ blocks: blockOrders });

      setHistoryIndex(targetIndex);
      toast.success("Undo successful");
    } catch (error) {
      toast.error("Failed to undo");
      console.error(error);
    }
  };

  const handleRedo = async () => {
    if (!canRedo) return;

    try {
      const targetIndex = historyIndex + 1;
      const targetSnapshot = history[targetIndex];
      
      // Delete blocks that don't exist in target snapshot
      const targetIds = new Set(targetSnapshot.map(b => b.id));
      for (const block of blocks) {
        if (!targetIds.has(block.id)) {
          await deleteMutation.mutateAsync({ id: block.id });
        }
      }

      // Create or update blocks from target snapshot
      for (const targetBlock of targetSnapshot) {
        const existingBlock = blocks.find(b => b.id === targetBlock.id);
        if (!existingBlock) {
          await createMutation.mutateAsync({
            pageId,
            type: targetBlock.type,
            content: targetBlock.content || "",
            settings: targetBlock.settings || "{}",
            order: targetBlock.order,
          });
        } else if (
          existingBlock.content !== targetBlock.content ||
          existingBlock.settings !== targetBlock.settings ||
          existingBlock.order !== targetBlock.order
        ) {
          await updateMutation.mutateAsync({
            id: targetBlock.id,
            content: targetBlock.content || "",
            settings: targetBlock.settings || "{}",
          });
        }
      }

      // Reorder if needed
      const blockOrders = targetSnapshot.map((block, index) => ({
        id: block.id,
        order: index,
      }));
      await reorderMutation.mutateAsync({ blocks: blockOrders });

      setHistoryIndex(targetIndex);
      toast.success("Redo successful");
    } catch (error) {
      toast.error("Failed to redo");
      console.error(error);
    }
  };

  const handleDuplicateBlock = async (block: PageBlock) => {
    try {
      // Find the position of the block to duplicate
      const blockIndex = allBlocks.findIndex((b) => b.id === block.id);
      const newOrder = blockIndex + 1;

      // Shift all blocks after this one down by 1
      const blocksToReorder = allBlocks
        .filter((b) => b.order > block.order)
        .map((b) => ({ id: b.id, order: b.order + 1 }));

      if (blocksToReorder.length > 0) {
        await reorderMutation.mutateAsync({ blocks: blocksToReorder });
      }

      // Create the duplicate block
      await createMutation.mutateAsync({
        pageId,
        type: block.type,
        content: block.content || "",
        settings: block.settings || "{}",
        order: newOrder,
      });

      toast.success("Block duplicated successfully");
    } catch (error) {
      toast.error("Failed to duplicate block");
      console.error(error);
    }
  };

  const handleDeleteBlock = async (id: number) => {
    if (!confirm("Are you sure you want to delete this block?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Block deleted successfully");
      blocksQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete block");
      console.error(error);
    }
  };

  const handleEditBlock = (block: PageBlock) => {
    setEditingBlock(block);
    setFormData({
      type: block.type,
      content: block.content || "",
      settings: block.settings || "{}",
      visibility: block.visibility || "{}",
      animation: block.animation || "{}",
    });
    setIsEditDialogOpen(true);
  };

  const handleMediaSelect = (url: string) => {
    setFormData((prev) => ({ ...prev, content: url }));
    setIsMediaPickerOpen(false);
  };

  const renderBlockForm = () => {
    const settings = JSON.parse(formData.settings || "{}");

    return (
      <div className="space-y-4">
        {!editingBlock && (
          <div>
            <Label htmlFor="type">Block Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, type: value as PageBlock["type"] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="quote">Quote</SelectItem>
                <SelectItem value="cta">Call to Action</SelectItem>
                <SelectItem value="spacer">Spacer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.type === "text" && (
          <div>
            <Label htmlFor="content">Text Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Enter your text content..."
              rows={6}
            />
          </div>
        )}

        {formData.type === "image" && (
          <div className="space-y-2">
            <Label htmlFor="content">Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="content"
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
              <Button type="button" onClick={() => setIsMediaPickerOpen(true)} variant="outline">
                Browse
              </Button>
            </div>
            {formData.content && (
              <img
                src={formData.content}
                alt="Preview"
                className="mt-2 max-h-48 rounded border"
              />
            )}
            <div className="mt-4 space-y-2">
              <Label htmlFor="caption">Caption (optional)</Label>
              <Input
                id="caption"
                value={settings.caption || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    settings: JSON.stringify({ ...settings, caption: e.target.value }),
                  }))
                }
                placeholder="Image caption"
              />
            </div>
          </div>
        )}

        {formData.type === "video" && (
          <div>
            <Label htmlFor="content">Video URL</Label>
            <Input
              id="content"
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="YouTube, Vimeo, or direct video URL"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Supports YouTube, Vimeo, and direct video file URLs
            </p>
          </div>
        )}

        {formData.type === "quote" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">Quote Text</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Enter the quote..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="author">Author (optional)</Label>
              <Input
                id="author"
                value={settings.author || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    settings: JSON.stringify({ ...settings, author: e.target.value }),
                  }))
                }
                placeholder="Author name"
              />
            </div>
            <div>
              <Label htmlFor="role">Role/Title (optional)</Label>
              <Input
                id="role"
                value={settings.role || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    settings: JSON.stringify({ ...settings, role: e.target.value }),
                  }))
                }
                placeholder="e.g., CEO, Author, etc."
              />
            </div>
          </div>
        )}

        {formData.type === "cta" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">Headline</Label>
              <Input
                id="content"
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Call to action headline"
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle (optional)</Label>
              <Input
                id="subtitle"
                value={settings.subtitle || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    settings: JSON.stringify({ ...settings, subtitle: e.target.value }),
                  }))
                }
                placeholder="Supporting text"
              />
            </div>
            <div>
              <Label htmlFor="buttonText">Button Text</Label>
              <Input
                id="buttonText"
                value={settings.buttonText || "Learn More"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    settings: JSON.stringify({ ...settings, buttonText: e.target.value }),
                  }))
                }
                placeholder="Button text"
              />
            </div>
            <div>
              <Label htmlFor="buttonLink">Button Link</Label>
              <Input
                id="buttonLink"
                value={settings.buttonLink || "#"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    settings: JSON.stringify({ ...settings, buttonLink: e.target.value }),
                  }))
                }
                placeholder="/contact"
              />
            </div>
          </div>
        )}

        {formData.type === "spacer" && (
          <div>
            <Label htmlFor="height">Spacer Height</Label>
            <Select
              value={settings.height || "medium"}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  settings: JSON.stringify({ ...settings, height: value }),
                  content: `Spacer (${value})`,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (2rem)</SelectItem>
                <SelectItem value="medium">Medium (4rem)</SelectItem>
                <SelectItem value="large">Large (6rem)</SelectItem>
                <SelectItem value="xlarge">Extra Large (8rem)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-neutral-900 dark:text-neutral-100">
            Block Editor
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Editing blocks for: <span className="font-medium">{pageName}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </Button>
          <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
          <Button variant="outline" onClick={handleExportLayout}>
            <Download className="w-4 h-4 mr-2" />
            Export Layout
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-layout-input')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Import Layout
          </Button>
          <input
            id="import-layout-input"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportLayout}
          />
          <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
          <Button variant="outline" onClick={() => setIsSaveTemplateOpen(true)} disabled={allBlocks.length === 0}>
            <Save className="w-4 h-4 mr-2" />
            Save as Template
          </Button>
          <Button variant="outline" onClick={() => setIsTemplateLibraryOpen(true)}>
            <Library className="w-4 h-4 mr-2" />
            Template Library
          </Button>
          <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
          <Button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            variant={isPreviewMode ? "default" : "outline"}
          >
            {isPreviewMode ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show Preview
              </>
            )}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Block
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search blocks by content, type, or settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
            Filter:
          </Label>
          <Select value={filterType} onValueChange={(value) => setFilterType(value as PageBlock["type"] | "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="quote">Quote</SelectItem>
              <SelectItem value="cta">CTA</SelectItem>
              <SelectItem value="spacer">Spacer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(searchQuery || filterType !== "all") && (
          <div className="text-sm text-neutral-500">
            {blocks.length} of {allBlocks.length} blocks
          </div>
        )}
      </div>

      <div className={isPreviewMode ? "grid grid-cols-2 gap-6" : ""}>
        {/* Editor Section */}
        <div className={isPreviewMode ? "border-r border-neutral-200 dark:border-neutral-800 pr-6" : ""}>
          {blocks.length === 0 && allBlocks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
              <p className="text-neutral-500">No blocks yet. Add your first block to get started.</p>
            </div>
          ) : blocks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
              <p className="text-neutral-500">No blocks match your search or filter criteria.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                   {blocks.map((block) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      onEdit={handleEditBlock}
                      onDelete={handleDeleteBlock}
                      onDuplicate={handleDuplicateBlock}
                      onViewHistory={(blockId) => {
                        setHistoryBlockId(blockId);
                        setIsHistoryOpen(true);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Preview Section */}
        {isPreviewMode && (
          <div className="pl-6">
            <div className="sticky top-4">
              <div className="mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                <h3 className="text-lg font-semibold">Live Preview</h3>
                <p className="text-sm text-neutral-500">Real-time preview of your blocks</p>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('desktop')}
                  >
                    Desktop
                  </Button>
                  <Button
                    variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('tablet')}
                  >
                    Tablet
                  </Button>
                  <Button
                    variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('mobile')}
                  >
                    Mobile
                  </Button>
                </div>
              </div>
              <div 
                className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden mx-auto transition-all duration-300" 
                style={{ 
                  maxHeight: 'calc(100vh - 200px)',
                  width: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '768px' : '375px',
                  maxWidth: '100%'
                }}
              >
                <BlockPreview blocks={allBlocks} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Block Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Block</DialogTitle>
            <DialogDescription>
              Choose a block type and configure its content
            </DialogDescription>
          </DialogHeader>
          {renderBlockForm()}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBlock}>Add Block</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Block Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Block</DialogTitle>
            <DialogDescription>Update the block content, visibility, and animation</DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="content" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="visibility">Visibility</TabsTrigger>
              <TabsTrigger value="animation">Animation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="mt-4">
              {renderBlockForm()}
            </TabsContent>
            
            <TabsContent value="visibility" className="mt-4">
              <VisibilitySettings
                value={formData.visibility}
                onChange={(value) => setFormData((prev) => ({ ...prev, visibility: value }))}
              />
            </TabsContent>
            
            <TabsContent value="animation" className="mt-4">
              <AnimationSettings
                value={formData.animation}
                onChange={(value) => setFormData((prev) => ({ ...prev, animation: value }))}
              />
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBlock}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Picker */}
      <MediaPicker
        open={isMediaPickerOpen}
        onSelect={handleMediaSelect}
        onClose={() => setIsMediaPickerOpen(false)}
      />

      {/* Save Template Dialog */}
      <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save the current blocks as a reusable template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Hero Section, Product Showcase"
              />
            </div>
            <div>
              <Label htmlFor="template-description">Description (optional)</Label>
              <Textarea
                id="template-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe what this template is for..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsSaveTemplateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsTemplate}>Save Template</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Library Dialog */}
      <Dialog open={isTemplateLibraryOpen} onOpenChange={setIsTemplateLibraryOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Block Template Library</DialogTitle>
            <DialogDescription>
              Load saved block templates into your page
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {templatesQuery.isLoading ? (
              <p className="text-center text-neutral-500 py-8">Loading templates...</p>
            ) : templatesQuery.data && templatesQuery.data.length > 0 ? (
              templatesQuery.data.map((template) => {
                const blockCount = JSON.parse(template.blocks).length;
                return (
                  <div
                    key={template.id}
                    className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            {template.description}
                          </p>
                        )}
                        <p className="text-xs text-neutral-500 mt-2">
                          {blockCount} block{blockCount !== 1 ? 's' : ''} • Created{' '}
                          {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleLoadTemplate(template.blocks)}
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                <Library className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
                <p className="text-neutral-500">No templates saved yet</p>
                <p className="text-sm text-neutral-400 mt-1">
                  Create blocks and save them as templates for reuse
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Block History Dialog */}
      {historyBlockId && (
        <BlockHistory
          blockId={historyBlockId}
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          onRestore={() => {
            blocksQuery.refetch();
          }}
        />
      )}
    </div>
  );
}
