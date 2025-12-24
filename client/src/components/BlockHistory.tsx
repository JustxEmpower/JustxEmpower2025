import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Clock, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface BlockHistoryProps {
  blockId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: () => void;
}

export function BlockHistory({ blockId, open, onOpenChange, onRestore }: BlockHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  
  const versionsQuery = trpc.admin.pages.blocks.versions.list.useQuery(
    { blockId },
    { enabled: open }
  );
  
  const restoreMutation = trpc.admin.pages.blocks.versions.restore.useMutation({
    onSuccess: () => {
      toast.success("Version restored successfully");
      onRestore();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to restore version: ${error.message}`);
    },
  });

  const handleRestore = (versionId: number) => {
    if (confirm("Are you sure you want to restore this version? This will replace the current block content.")) {
      restoreMutation.mutate({ versionId });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const versions = versionsQuery.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Version History
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3">
          {versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No version history available</p>
              <p className="text-sm mt-2">Versions are created when you edit this block</p>
            </div>
          ) : (
            versions.map((version, index) => (
              <div
                key={version.id}
                className={`border rounded-lg p-4 transition-colors ${
                  selectedVersion === version.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedVersion(version.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium">
                      Version {version.versionNumber}
                      {index === versions.length - 1 && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDate(version.createdAt.toString())}
                      {version.createdBy && ` • by ${version.createdBy}`}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(version.id);
                    }}
                    disabled={restoreMutation.isPending}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restore
                  </Button>
                </div>

                <div className="bg-muted/50 rounded p-3 text-sm">
                  <div className="font-medium text-xs text-muted-foreground mb-2">
                    Content Preview:
                  </div>
                  <div className="line-clamp-3">
                    {version.content ? (
                      <div dangerouslySetInnerHTML={{ __html: version.content.substring(0, 200) + (version.content.length > 200 ? "..." : "") }} />
                    ) : (
                      <span className="text-muted-foreground italic">No content</span>
                    )}
                  </div>
                </div>

                {version.settings && version.settings !== "{}" && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">Settings:</span> {version.settings}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-4 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
