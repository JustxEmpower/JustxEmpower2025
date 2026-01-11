import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ChevronUp, ChevronDown, Copy } from 'lucide-react';

export interface LegalSection {
  id: string;
  header: string;
  body: string;
  footer?: string;
}

interface SectionCreatorWizardProps {
  sections: LegalSection[];
  onChange: (sections: LegalSection[]) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export default function SectionCreatorWizard({ 
  sections, 
  onChange, 
  onSave, 
  isSaving = false 
}: SectionCreatorWizardProps) {
  const [hasChanges, setHasChanges] = useState(false);

  // Add a new section
  const addSection = () => {
    const newSection: LegalSection = {
      id: `section-${Date.now()}`,
      header: '',
      body: '',
      footer: '',
    };
    const updated = [...sections, newSection];
    onChange(updated);
    setHasChanges(true);
  };

  // Update a section
  const updateSection = (id: string, updates: Partial<LegalSection>) => {
    const updated = sections.map(section =>
      section.id === id ? { ...section, ...updates } : section
    );
    onChange(updated);
    setHasChanges(true);
  };

  // Delete a section
  const deleteSection = (id: string) => {
    const updated = sections.filter(section => section.id !== id);
    onChange(updated);
    setHasChanges(true);
  };

  // Move section up
  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...sections];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
    setHasChanges(true);
  };

  // Move section down
  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const updated = [...sections];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
    setHasChanges(true);
  };

  // Duplicate a section
  const duplicateSection = (index: number) => {
    const section = sections[index];
    const newSection: LegalSection = {
      ...section,
      id: `section-${Date.now()}`,
    };
    const updated = [...sections.slice(0, index + 1), newSection, ...sections.slice(index + 1)];
    onChange(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave();
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
          Legal Document Builder
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Create your legal document by adding sections with headers, body text, and optional footers. Changes sync in real-time.
        </p>
      </div>

      {/* Add Section Button */}
      <div>
        <Button
          type="button"
          onClick={addSection}
          className="gap-2"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          Add Section
        </Button>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900/50">
          <Plus className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-2">No sections yet</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Click "Add Section" above to start building your legal document
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
            >
              {/* Section Header Bar */}
              <div className="bg-gradient-to-r from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 px-4 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Section {index + 1}
                  </span>
                  {section.header && (
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium truncate">
                      {section.header}
                    </span>
                  )}
                </div>

                {/* Section Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => moveDown(index)}
                    disabled={index === sections.length - 1}
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => duplicateSection(index)}
                    title="Duplicate section"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => deleteSection(section.id)}
                    title="Delete section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Section Content */}
              <div className="p-6 space-y-6">
                {/* Header Field */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Section Header
                  </label>
                  <Input
                    value={section.header}
                    onChange={(e) => updateSection(section.id, { header: e.target.value })}
                    placeholder="Enter section title (e.g., 'Introduction', 'Your Rights', 'Contact Us')"
                    className="text-base"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    This will appear as a heading on your legal page
                  </p>
                </div>

                {/* Body Field */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Section Body
                  </label>
                  <Textarea
                    value={section.body}
                    onChange={(e) => updateSection(section.id, { body: e.target.value })}
                    placeholder="Enter section content. Separate paragraphs with blank lines for spacing."
                    className="min-h-[150px] text-base font-mono"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Use blank lines between paragraphs for proper spacing
                  </p>
                </div>

                {/* Footer Field (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Section Footer (Optional)
                  </label>
                  <Input
                    value={section.footer || ''}
                    onChange={(e) => updateSection(section.id, { footer: e.target.value })}
                    placeholder="Enter optional footer text (e.g., 'Last updated: January 2026')"
                    className="text-base"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Optional: Add a footer note to this section
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Button */}
      {hasChanges && (
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 sticky bottom-0 bg-white dark:bg-neutral-950 -mx-6 px-6 py-4">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            size="lg"
            className="w-full"
          >
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
