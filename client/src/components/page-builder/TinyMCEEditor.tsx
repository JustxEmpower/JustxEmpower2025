import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface TinyMCEEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  menubar?: boolean;
  inline?: boolean;
  toolbar?: string;
  className?: string;
}

export default function TinyMCEEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  height = 300,
  menubar = false,
  inline = false,
  toolbar = 'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright | bullist numlist | link image | forecolor backcolor | removeformat',
  className = '',
}: TinyMCEEditorProps) {
  const editorRef = useRef<any>(null);

  return (
    <div className={className}>
      <Editor
        onInit={(evt, editor) => (editorRef.current = editor)}
        value={value}
        onEditorChange={(content) => onChange(content)}
        inline={inline}
        init={{
          height,
          menubar,
          placeholder,
          plugins: [
            'advlist',
            'autolink',
            'lists',
            'link',
            'image',
            'charmap',
            'preview',
            'anchor',
            'searchreplace',
            'visualblocks',
            'code',
            'fullscreen',
            'insertdatetime',
            'media',
            'table',
            'help',
            'wordcount',
          ],
          toolbar,
          content_style: `
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 16px;
              line-height: 1.6;
              color: #1a1a1a;
            }
            p { margin: 0 0 1em 0; }
            h1, h2, h3, h4, h5, h6 { margin: 0 0 0.5em 0; font-weight: 600; }
          `,
          skin: 'oxide',
          content_css: 'default',
          branding: false,
          promotion: false,
          statusbar: false,
          resize: false,
          paste_data_images: true,
          automatic_uploads: true,
          file_picker_types: 'image',
          images_upload_handler: async (blobInfo) => {
            // For now, return a data URL. In production, upload to server.
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blobInfo.blob());
            });
          },
        }}
      />
    </div>
  );
}

// Inline variant for use in page builder blocks
export function InlineTinyMCEEditor({
  value,
  onChange,
  placeholder = 'Click to edit...',
  className = '',
}: Omit<TinyMCEEditorProps, 'height' | 'menubar' | 'inline'>) {
  const editorRef = useRef<any>(null);

  return (
    <div className={className}>
      <Editor
        onInit={(evt, editor) => (editorRef.current = editor)}
        value={value}
        onEditorChange={(content) => onChange(content)}
        inline={true}
        init={{
          menubar: false,
          placeholder,
          plugins: ['autolink', 'lists', 'link'],
          toolbar: 'bold italic underline | link | bullist numlist',
          content_style: `
            body {
              font-family: inherit;
              font-size: inherit;
              line-height: inherit;
              color: inherit;
            }
          `,
          branding: false,
          promotion: false,
          statusbar: false,
        }}
      />
    </div>
  );
}
