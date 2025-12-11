import { PluginSettings } from './types';

/**
 * Default settings for the Google Docs Exporter plugin
 * These values match the requirements specified in 6.1-6.9
 */
export const DEFAULT_SETTINGS: PluginSettings = {
	// Requirement 6.1: Default export format
	defaultFormat: 'docx',
	
	// Export location (not specified in requirements, using reasonable default)
	exportLocation: '',
	
	// Requirement 6.2: Mermaid link text with default value
	mermaidLinkText: '📊 View Diagram',
	
	// Requirement 6.3: Include diagram type in Mermaid links (default enabled)
	includeMermaidType: true,
	
	// Requirement 6.4: Code block font
	codeBlockFont: 'Consolas',
	
	// Requirement 6.5: Code block background color
	codeBlockBackground: '#f5f5f5',
	
	// Requirement 6.6: Include language labels above code blocks (default enabled)
	includeLanguageLabel: true,
	
	// Requirement 6.7: Image handling mode
	imageHandling: 'embed',
	
	// Requirement 6.8: Convert Obsidian internal links to plain text (default enabled)
	removeObsidianLinks: true,
	
	// Requirement 6.9: Automatically open files after export (default disabled)
	openAfterExport: false,
};
