import { Plugin, TFile, Notice, addIcon } from 'obsidian';
import { PluginSettings } from './types';
import { DEFAULT_SETTINGS } from './settings';
import { ExportModal } from './ui/ExportModal';
import { SettingsTab } from './ui/SettingsTab';
import { DocxExporter } from './exporters/docxExporter';
import { ClipboardExporter } from './exporters/clipboardExporter';
import { HtmlExporter } from './exporters/htmlExporter';

/**
 * GoogleDocsExporterPlugin is the main plugin class that integrates with Obsidian.
 * Handles plugin lifecycle, command registration, UI integration, and export orchestration.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 8.1, 8.2, 8.3
 */
export default class GoogleDocsExporterPlugin extends Plugin {
	settings!: PluginSettings;

	/**
	 * Called when the plugin is loaded.
	 * Registers all commands, ribbon icon, context menu, and settings tab.
	 * 
	 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
	 */
	async onload() {
		// Load settings
		await this.loadSettings();

		// Register custom icon for ribbon
		addIcon('file-up', '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><polyline points="9 15 12 12 15 15"></polyline></svg>');

		// Requirement 5.1: Register "Export current note to DOCX" command
		this.addCommand({
			id: 'export-to-docx',
			name: 'Export current note to DOCX',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				
				// Only enable for markdown files
				if (activeFile && activeFile.extension === 'md') {
					if (!checking) {
						this.exportNote(activeFile, 'docx');
					}
					return true;
				}
				
				return false;
			}
		});

		// Requirement 5.2: Register "Export current note to clipboard" command
		this.addCommand({
			id: 'export-to-clipboard',
			name: 'Export current note to clipboard',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				
				// Only enable for markdown files
				if (activeFile && activeFile.extension === 'md') {
					if (!checking) {
						this.exportNote(activeFile, 'clipboard');
					}
					return true;
				}
				
				return false;
			}
		});

		// Requirement 5.3: Register "Export to Google Docs..." command that opens modal
		this.addCommand({
			id: 'export-modal',
			name: 'Export to Google Docs...',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				
				// Only enable for markdown files
				if (activeFile && activeFile.extension === 'md') {
					if (!checking) {
						this.openExportModal(activeFile);
					}
					return true;
				}
				
				return false;
			}
		});

		// Requirement 5.4: Add ribbon icon that opens export modal
		this.addRibbonIcon('file-up', 'Export to Google Docs', () => {
			const activeFile = this.app.workspace.getActiveFile();
			
			if (activeFile && activeFile.extension === 'md') {
				this.openExportModal(activeFile);
			} else {
				// Requirement 8.3: Show notification when no active file
				new Notice('Please open a markdown file first');
			}
		});

		// Requirement 5.5, 5.6: Register context menu for file explorer
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				// Only add menu item for markdown files
				if (file instanceof TFile && file.extension === 'md') {
					menu.addItem((item) => {
						item
							.setTitle('Export to Google Docs')
							.setIcon('file-up')
							.onClick(() => {
								this.openExportModal(file);
							});
					});
				}
			})
		);

		// Register settings tab
		this.addSettingTab(new SettingsTab(this.app, this));
	}

	/**
	 * Called when the plugin is unloaded.
	 * Cleanup if needed.
	 */
	onunload() {
		// No cleanup needed currently
	}

	/**
	 * Loads plugin settings from data storage.
	 * Merges saved settings with defaults to handle new settings added in updates.
	 * 
	 * Requirement 6.10: Settings persistence
	 */
	async loadSettings() {
		const loadedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
	}

	/**
	 * Saves plugin settings to data storage.
	 * 
	 * Requirement 6.10: Settings persistence
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Opens the export modal for the specified file.
	 * 
	 * @param file - The file to export
	 */
	private openExportModal(file: TFile) {
		const modal = new ExportModal(
			this.app,
			file,
			this.settings,
			(file, format) => this.exportNote(file, format)
		);
		modal.open();
	}

	/**
	 * Orchestrates the export process based on the selected format.
	 * Handles all error cases and displays appropriate notifications.
	 * 
	 * Requirements: 4.4, 4.5, 5.8, 7.1, 8.1, 8.2, 8.3
	 * 
	 * @param file - The file to export
	 * @param format - The export format (docx, clipboard, or html)
	 */
	async exportNote(file: TFile, format: 'docx' | 'clipboard' | 'html'): Promise<void> {
		let progressNotice: Notice | null = null;
		
		try {
			// Requirement 8.3: Handle notes without active file
			if (!file) {
				new Notice('❌ No file selected. Please open a markdown file first.');
				return;
			}

			// Requirement 5.8: Show progress indicator
			progressNotice = new Notice('Exporting...', 0);

			// Read file content
			const content = await this.app.vault.read(file);

			// Requirement 7.1: Handle empty note gracefully
			if (!content || content.trim().length === 0) {
				console.log('Exporting empty note:', file.path);
			}

			// Export based on format
			switch (format) {
				case 'docx':
					await DocxExporter.export(content, file.basename, this.settings);
					
					// Requirement 4.4: Display success notification with filename
					progressNotice.hide();
					new Notice(`✅ Exported to ${file.basename}.docx`);
					break;

				case 'clipboard':
					await ClipboardExporter.export(content, this.settings);
					
					// Requirement 4.5: Display success notification with paste instruction
					progressNotice.hide();
					new Notice('✅ Copied to clipboard! Paste into Google Docs with Ctrl+V (Cmd+V on Mac)');
					break;

				case 'html':
					await HtmlExporter.export(content, file.basename, this.settings);
					
					// Display success notification with filename
					progressNotice.hide();
					new Notice(`✅ Exported to ${file.basename}.html`);
					break;

				default:
					progressNotice.hide();
					throw new Error(`Unknown export format: ${format}`);
			}

		} catch (error) {
			// Hide progress notice if it exists
			if (progressNotice) {
				progressNotice.hide();
			}

			// Requirement 8.1: Display error notification with error description
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			new Notice(`❌ Export failed: ${errorMessage}`);

			// Requirement 8.2: Log error details to console for debugging
			console.error('Export error:', error);
			console.error('File:', file?.path || 'No file');
			console.error('Format:', format);
			
			// Log stack trace if available
			if (error instanceof Error && error.stack) {
				console.error('Stack trace:', error.stack);
			}
		}
	}
}
