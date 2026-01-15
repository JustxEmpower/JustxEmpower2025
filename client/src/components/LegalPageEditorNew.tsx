import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, ChevronUp, ChevronDown, Copy } from 'lucide-react';
import { toast } from 'sonner';

export interface LegalSection {
  id: string;
  header: string;
  body: string;
  footer?: string;
}

interface LegalPageEditorNewProps {
  sections: LegalSection[];
  onChange: (sections: LegalSection[]) => void;
  onSave: () => void;
  isSaving?: boolean;
  pageName?: string;
}

export default function LegalPageEditorNew({
  sections,
  onChange,
  onSave,
  isSaving = false,
  pageName = 'Legal Page',
}: LegalPageEditorNewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addSection = () => {
    const newSection: LegalSection = {
      id: Date.now().toString(),
      header: '',
      body: '',
      footer: '',
    };
    onChange([...sections, newSection]);
    setExpandedId(newSection.id);
    toast.success('New section added');
  };

  const updateSection = (id: string, updates: Partial<LegalSection>) => {
    onChange(
      sections.map(section =>
        section.id === id ? { ...section, ...updates } : section
      )
    );
  };

  const deleteSection = (id: string) => {
    onChange(sections.filter(section => section.id !== id));
    toast.success('Section deleted');
  };

  const duplicateSection = (id: string) => {
    const section = sections.find(s => s.id === id);
    if (section) {
      const newSection: LegalSection = {
        ...section,
        id: Date.now().toString(),
      };
      const index = sections.findIndex(s => s.id === id);
      const newSections = [...sections];
      newSections.splice(index + 1, 0, newSection);
      onChange(newSections);
      toast.success('Section duplicated');
    }
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id);
    if (
      (direction === 'up' && index > 0) ||
      (direction === 'down' && index < sections.length - 1)
    ) {
      const newSections = [...sections];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newSections[index], newSections[targetIndex]] = [
        newSections[targetIndex],
        newSections[index],
      ];
      onChange(newSections);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
          {pageName} Editor
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Build your legal document by adding sections with headers, body text, and optional footers.
        </p>
      </div>

      {/* Add Section Button */}
      <div className="mb-6">
        <Button
          onClick={addSection}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          Add Section
        </Button>
      </div>

      {/* Sections List */}
      <div className="space-y-4 mb-8">
        {sections.length === 0 ? (
          <Card className="p-8 text-center border-2 border-dashed border-neutral-300 dark:border-neutral-700">
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              No sections yet. Click "Add Section" to get started.
            </p>
          </Card>
        ) : (
          sections.map((section, index) => (
            <Card
              key={section.id}
              className="p-6 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() =>
                    setExpandedId(expandedId === section.id ? null : section.id)
                  }
                  className="flex items-center gap-3 flex-1 text-left hover:opacity-70 transition-opacity"
                >
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      expandedId === section.id ? 'rotate-180' : ''
                    }`}
                  />
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    Section {index + 1}
                  </span>
                  {section.header && (
                    <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                      {section.header}
                    </span>
                  )}
                </button>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveSection(section.id, 'up')}
                    disabled={index === 0}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveSection(section.id, 'down')}
                    disabled={index === sections.length - 1}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => duplicateSection(section.id)}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === section.id && (
                <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  {/* Header Field */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Section Header
                    </label>
                    <Input
                      value={section.header}
                      onChange={e =>
                        updateSection(section.id, { header: e.target.value })
                      }
                      placeholder="e.g., Introduction, Your Rights, Contact Us"
                      className="w-full"
                    />
                  </div>

                  {/* Body Field */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Body Text
                    </label>
                    <Textarea
                      value={section.body}
                      onChange={e =>
                        updateSection(section.id, { body: e.target.value })
                      }
                      placeholder="Enter your content here. Separate paragraphs with blank lines for spacing."
                      rows={6}
                      className="w-full font-mono text-sm"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                      💡 Tip: Use blank lines to create spacing between paragraphs
                    </p>
                  </div>

                  {/* Footer Field */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Footer (Optional)
                    </label>
                    <Input
                      value={section.footer || ''}
                      onChange={e =>
                        updateSection(section.id, { footer: e.target.value })
                      }
                      placeholder="e.g., Last updated: January 2024"
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Save Button */}
      {sections.length > 0 && (
        <div className="flex gap-3">
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center">
            {sections.length} section{sections.length !== 1 ? 's' : ''} created
          </p>
        </div>
      )}
    </div>
  );
}
