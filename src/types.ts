/**
 * Core type definitions for the Google Docs Exporter plugin.
 * 
 * This file defines the complete type system for the plugin, including:
 * - Plugin settings and configuration
 * - Inline content types (text formatting)
 * - Content block types (document structure)
 * - Parsed content representation
 * 
 * The type system follows a hierarchical structure:
 * ParsedContent → ContentBlock[] → InlineContent[]
 */

// ============================================================================
// Plugin Settings
// ============================================================================

/**
 * Plugin configuration settings.
 * All settings are persisted to Obsidian's plugin data storage.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10
 */
export interface PluginSettings {
	/** Default export format (DOCX, Clipboard, or HTML) - Requirement 6.1 */
	defaultFormat: 'docx' | 'clipboard' | 'html';
	
	/** Default location for exported files */
	exportLocation: string;
	
	/** Text to display for Mermaid diagram links - Requirement 6.2 */
	mermaidLinkText: string;
	
	/** Whether to include diagram type in Mermaid links - Requirement 6.3 */
	includeMermaidType: boolean;
	
	/** Font family for code blocks - Requirement 6.4 */
	codeBlockFont: string;
	
	/** Background color (hex) for code blocks - Requirement 6.5 */
	codeBlockBackground: string;
	
	/** Whether to show language labels above code blocks - Requirement 6.6 */
	includeLanguageLabel: boolean;
	
	/** How to handle images: embed, link, or skip - Requirement 6.7 */
	imageHandling: 'embed' | 'link' | 'skip';
	
	/** Whether to convert Obsidian [[links]] to plain text - Requirement 6.8 */
	removeObsidianLinks: boolean;
	
	/** Whether to automatically open files after export - Requirement 6.9 */
	openAfterExport: boolean;
}

// ============================================================================
// Inline Content Types
// ============================================================================

/**
 * Inline content types represent text-level formatting within paragraphs,
 * headings, list items, and other block-level elements.
 * 
 * Requirements: 3.4, 3.5, 3.6, 3.9, 3.14, 9.4
 */

/**
 * Plain text content without formatting.
 * Requirement 9.4: Base inline content type
 */
export interface TextContent {
	type: 'text';
	content: string;
}

/**
 * Bold formatted text (**text** or __text__).
 * Requirement 3.4: Bold formatting support
 */
export interface BoldContent {
	type: 'bold';
	content: InlineContent[];
}

/**
 * Italic formatted text (*text* or _text_).
 * Requirement 3.5: Italic formatting support
 */
export interface ItalicContent {
	type: 'italic';
	content: InlineContent[];
}

/**
 * Strikethrough formatted text (~~text~~).
 * Requirement 3.6: Strikethrough formatting support
 */
export interface StrikethroughContent {
	type: 'strikethrough';
	content: InlineContent[];
}

/**
 * Inline code formatted text (`code`).
 * Requirement 3.14: Inline code formatting support
 */
export interface CodeContent {
	type: 'code';
	content: string;
}

/**
 * Hyperlink with text and URL ([text](url)).
 * Requirement 3.9: Hyperlink conversion support
 */
export interface LinkContent {
	type: 'link';
	text: InlineContent[];
	url: string;
}

/**
 * Union type of all inline content types.
 * Allows nested formatting (e.g., bold within italic).
 * 
 * Requirement 9.4: InlineContent type correctness
 * Requirement 7.5: Mixed formatting composition
 */
export type InlineContent =
	| TextContent
	| BoldContent
	| ItalicContent
	| StrikethroughContent
	| CodeContent
	| LinkContent;

// ============================================================================
// Content Block Types
// ============================================================================

/**
 * Content block types represent document-level structural elements.
 * Each block type corresponds to a markdown element type.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.7, 3.8, 3.10, 3.11, 3.12, 3.15, 9.3
 */

/**
 * Heading block (# Heading).
 * Requirements 3.1, 3.2, 3.3: Heading level conversion (H1-H6)
 */
export interface HeadingBlock {
	type: 'heading';
	/** Heading level from 1 (H1) to 6 (H6) */
	level: 1 | 2 | 3 | 4 | 5 | 6;
	/** Heading text with inline formatting */
	content: InlineContent[];
}

/**
 * Paragraph block containing inline content.
 * Requirement 9.3: ContentBlock type correctness
 */
export interface ParagraphBlock {
	type: 'paragraph';
	content: InlineContent[];
}

/**
 * Code block with optional language identifier (```language).
 * Requirements 2.1, 2.2, 2.3, 2.4, 2.5: Code block preservation and formatting
 */
export interface CodeBlock {
	type: 'code';
	/** Language identifier (e.g., 'python', 'javascript') or null if not specified */
	language: string | null;
	/** Raw code content with all whitespace preserved */
	content: string;
}

/**
 * Mermaid diagram block converted to interactive link.
 * Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6: Mermaid diagram conversion
 */
export interface MermaidBlock {
	type: 'mermaid';
	/** Formatted diagram type name (e.g., 'Flowchart', 'Sequence Diagram') */
	diagramType: string;
	/** Original Mermaid code */
	code: string;
	/** Generated Mermaid Live URL with encoded diagram */
	url: string;
}

/**
 * List item with optional nested list.
 * Requirement 7.4: Nested list preservation
 */
export interface ListItem {
	/** Item content with inline formatting */
	content: InlineContent[];
	/** Optional nested list (for hierarchical lists) */
	children?: ListBlock;
}

/**
 * List block (ordered or unordered).
 * Requirements 3.7, 3.8: List structure conversion
 */
export interface ListBlock {
	type: 'list';
	/** True for ordered lists (1. 2. 3.), false for unordered (- * +) */
	ordered: boolean;
	/** List items with optional nesting */
	items: ListItem[];
}

/**
 * Table block with headers and data rows.
 * Requirement 3.15: Table structure preservation
 */
export interface TableBlock {
	type: 'table';
	/** Header row cells (array of cell content) */
	headers: InlineContent[][];
	/** Data rows (array of rows, each row is array of cells) */
	rows: InlineContent[][][];
}

/**
 * Blockquote block (> quoted text).
 * Requirement 3.10: Blockquote formatting
 */
export interface BlockquoteBlock {
	type: 'blockquote';
	/** Blockquote content (can contain any block types) */
	content: ContentBlock[];
}

/**
 * Horizontal rule block (--- or ***).
 * Requirement 3.11: Horizontal rule conversion
 */
export interface HorizontalRuleBlock {
	type: 'hr';
}

/**
 * Image block (![alt](url)).
 * Requirement 3.12: Image handling
 */
export interface ImageBlock {
	type: 'image';
	/** Alt text for the image */
	alt: string;
	/** Image URL or file path */
	url: string;
}

/**
 * Union type of all content block types.
 * Represents the complete document structure.
 * 
 * Requirement 9.3: ContentBlock type correctness
 */
export type ContentBlock =
	| HeadingBlock
	| ParagraphBlock
	| CodeBlock
	| MermaidBlock
	| ListBlock
	| TableBlock
	| BlockquoteBlock
	| HorizontalRuleBlock
	| ImageBlock;

// ============================================================================
// Parsed Content
// ============================================================================

/**
 * Parsed content representation.
 * The result of parsing markdown into a structured format.
 * 
 * This is the intermediate representation used by all exporters.
 * Decouples parsing from export format, allowing multiple export
 * formats from a single parse.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */
export interface ParsedContent {
	/** Array of top-level content blocks representing the document structure */
	blocks: ContentBlock[];
}
