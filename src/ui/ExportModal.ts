import { App, Modal, Setting, TFile, Notice } from 'obsidian';
import { PluginSettings } from '../types';

/**
 * ExportModal provides a UI for selecting export format and initiating export.
 * Displays note title, format selection dropdown, content preview, and export button.
 * 
 * Requirements: 5.7
 */
export class ExportModal extends Modal {
	private file: TFile;
	private settings: PluginSettings;
	private selectedFormat: 'docx' | 'clipboard' | 'html';
	private onExport: (file: TFile, format: 'docx' | 'clipboard' | 'html') => Promise<void>;
	private isExporting: boolean = false;
	private exportButton: HTMLButtonElement | null = null;

	constructor(
		app: App,
		file: TFile,
		settings: PluginSettings,
		onExport: (file: TFile, format: 'docx' | 'clipboard' | 'html') => Promise<void>
	) {
		super(app);
		this.file = file;
		this.settings = settings;
		this.selectedFormat = settings.defaultFormat;
		this.onExport = onExport;
	}

	/**
	 * Renders the modal UI with note title, format dropdown, preview, and export button.
	 * Called automatically when modal is opened.
	 */
	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Set modal title
		contentEl.createEl('h2', { text: 'Export to Google Docs' });

		// Display note title
		contentEl.createEl('p', {
			text: `Note: ${this.file.basename}`,
			cls: 'export-modal-note-title'
		});

		// Format selection dropdown
		new Setting(contentEl)
			.setName('Export format')
			.setDesc('Choose the output format for your export')
			.addDropdown(dropdown => {
				dropdown
					.addOption('docx', 'DOCX (Word Document)')
					.addOption('clipboard', 'Clipboard (Rich Text)')
					.addOption('html', 'HTML (Web Page)')
					.setValue(this.selectedFormat)
					.onChange(value => {
						this.selectedFormat = value as 'docx' | 'clipboard' | 'html';
					});
			});

		// Preview section
		const previewContainer = contentEl.createDiv({ cls: 'export-modal-preview' });
		this.updatePreview(previewContainer);

		// Button container
		const buttonContainer = contentEl.createDiv({ cls: 'export-modal-buttons' });

		// Export button
		this.exportButton = buttonContainer.createEl('button', {
			text: 'Export',
			cls: 'mod-cta'
		});
		this.exportButton.addEventListener('click', () => this.handleExport());

		// Cancel button
		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel'
		});
		cancelButton.addEventListener('click', () => this.close());
	}

	/**
	 * Updates the preview section with content statistics.
	 * Counts Mermaid diagrams and code blocks in the note.
	 * 
	 * @param el - The container element for the preview
	 */
	private async updatePreview(el: HTMLElement) {
		el.empty();
		el.createEl('h3', { text: 'Content Preview' });

		try {
			// Read file content
			const content = await this.app.vault.read(this.file);

			// Count Mermaid diagrams
			const mermaidRegex = /```mermaid\n[\s\S]*?```/g;
			const mermaidMatches = content.match(mermaidRegex);
			const mermaidCount = mermaidMatches ? mermaidMatches.length : 0;

			// Count code blocks (excluding Mermaid)
			const codeBlockRegex = /```(?!mermaid)[\s\S]*?```/g;
			const codeMatches = content.match(codeBlockRegex);
			const codeBlockCount = codeMatches ? codeMatches.length : 0;

			// Display statistics
			const statsContainer = el.createDiv({ cls: 'export-modal-stats' });
			
			if (mermaidCount > 0) {
				statsContainer.createEl('p', {
					text: `📊 ${mermaidCount} Mermaid diagram${mermaidCount !== 1 ? 's' : ''} (will be converted to links)`
				});
			}

			if (codeBlockCount > 0) {
				statsContainer.createEl('p', {
					text: `💻 ${codeBlockCount} code block${codeBlockCount !== 1 ? 's' : ''} (will be formatted)`
				});
			}

			if (mermaidCount === 0 && codeBlockCount === 0) {
				statsContainer.createEl('p', {
					text: 'No special content detected',
					cls: 'export-modal-no-content'
				});
			}

		} catch {
			el.createEl('p', {
				text: 'Error reading file content',
				cls: 'export-modal-error'
			});
		}
	}

	/**
	 * Handles the export button click.
	 * Calls the plugin's exportNote method and manages loading state.
	 */
	private async handleExport() {
		if (this.isExporting) {
			return; // Prevent multiple simultaneous exports
		}

		this.isExporting = true;

		// Update button to show loading state
		if (this.exportButton) {
			this.exportButton.disabled = true;
			this.exportButton.setText('Exporting...');
		}

		try {
			// Call the export function provided by the plugin
			await this.onExport(this.file, this.selectedFormat);
			
			// Close modal on success
			this.close();
		} catch {
			// Error handling is done in the plugin's exportNote method
			// Just reset the button state here
		} finally {
			// Reset button state
			this.isExporting = false;
			if (this.exportButton) {
				this.exportButton.disabled = false;
				this.exportButton.setText('Export');
			}
		}
	}

	/**
	 * Cleanup when modal is closed.
	 */
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
