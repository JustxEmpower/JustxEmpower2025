import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import MediaPicker from "@/components/MediaPicker";

interface PageBlock {
  id: number;
  pageId: number;
  type: "text" | "image" | "video" | "quote" | "cta" | "spacer";
  content: string | null;
  settings: string | null;
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
}

function SortableBlock({ block, onEdit, onDelete }: SortableBlockProps) {
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
  });

  const blocksQuery = trpc.admin.pages.blocks.list.useQuery({ pageId });
  const createMutation = trpc.admin.pages.blocks.create.useMutation();
  const updateMutation = trpc.admin.pages.blocks.update.useMutation();
  const deleteMutation = trpc.admin.pages.blocks.delete.useMutation();
  const reorderMutation = trpc.admin.pages.blocks.reorder.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const blocks = blocksQuery.data || [];

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
        order: blocks.length,
      });
      toast.success("Block added successfully");
      setIsAddDialogOpen(false);
      setFormData({ type: "text", content: "", settings: "{}" });
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
      });
      toast.success("Block updated successfully");
      setIsEditDialogOpen(false);
      setEditingBlock(null);
      blocksQuery.refetch();
    } catch (error) {
      toast.error("Failed to update block");
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
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Block
        </Button>
      </div>

      {blocks.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
          <p className="text-neutral-500">No blocks yet. Add your first block to get started.</p>
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
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Block</DialogTitle>
            <DialogDescription>Update the block content and settings</DialogDescription>
          </DialogHeader>
          {renderBlockForm()}
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
    </div>
  );
}
