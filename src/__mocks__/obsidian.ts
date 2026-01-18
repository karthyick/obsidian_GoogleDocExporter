/**
 * Mock for Obsidian module used in tests.
 * Provides minimal implementations of Obsidian APIs.
 */

export class Plugin {
  app: any;
  manifest: any;

  loadData() { return Promise.resolve({}); }
  saveData(_data: any) { return Promise.resolve(); }
  addCommand(_command: any) {}
  addRibbonIcon(_icon: string, _title: string, _callback: () => void) {}
  registerEvent(_event: any) {}
  addSettingTab(_tab: any) {}
}

export class PluginSettingTab {
  app: any;
  plugin: Plugin;
  containerEl: HTMLElement;

  constructor(app: any, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
  }

  display() {}
}

export class Modal {
  app: any;
  contentEl: HTMLElement;

  constructor(app: any) {
    this.app = app;
    this.contentEl = document.createElement('div');
  }

  open() {}
  close() {}
  onOpen() {}
  onClose() {}
}

export class Notice {
  constructor(_message: string, _timeout?: number) {}
  hide() {}
}

export class Setting {
  constructor(_containerEl: HTMLElement) {}
  setName(_name: string) { return this; }
  setDesc(_desc: string) { return this; }
  addText(_callback: (text: any) => void) { return this; }
  addToggle(_callback: (toggle: any) => void) { return this; }
  addDropdown(_callback: (dropdown: any) => void) { return this; }
}

export class TFile {
  basename: string = '';
  extension: string = 'md';
  path: string = '';
  name: string = '';
  parent: any = null;
  stat: any = {};
  vault: any = null;
}

export function addIcon(_id: string, _svgContent: string) {}
