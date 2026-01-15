import { PageBlock } from '../usePageBuilderStore';

// Type for JE renderer props that supports both admin (block prop) and public (content prop) rendering
export type JERendererProps = 
  | { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }
  | { content: any; blockType?: string };

// Helper function to normalize props for JE renderers
export function normalizeJERendererProps(props: JERendererProps, defaultType: string = 'je-block') {
  if ('block' in props) {
    return {
      block: props.block,
      content: props.block.content,
      isEditing: props.isEditing ?? false,
      isBlockSelected: props.isBlockSelected ?? false,
    };
  } else {
    return {
      block: { id: 'public', type: props.blockType || defaultType, content: props.content } as PageBlock,
      content: props.content,
      isEditing: false,
      isBlockSelected: false,
    };
  }
}
