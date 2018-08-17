import { ISanitizer } from '@jupyterlab/apputils';

import { INotebookTracker } from '@jupyterlab/notebook';

import { each } from '@phosphor/algorithm';

import { TableOfContentsRegistry } from '../../registry';

import { TableOfContents } from '../../toc';

export class NotebookGeneratorOptionsManager extends TableOfContentsRegistry.IGeneratorOptionsManager {
  constructor(
    widget: TableOfContents,
    notebook: INotebookTracker,
    options: { needNumbering: boolean; sanitizer: ISanitizer }
  ) {
    super();
    this._numbering = options.needNumbering;
    this._widget = widget;
    this._notebook = notebook;
    this.sanitizer = options.sanitizer;
  }

  private changeNumberingStateForAllCells(showNumbering: boolean) {
    if (this._notebook.currentWidget) {
      each(this._notebook.currentWidget.content.widgets, cell => {
        let headingNodes = cell.node.querySelectorAll('h1, h2, h3, h4, h5, h6');
        each(headingNodes, heading => {
          if (heading.getElementsByClassName('numbering-entry').length > 0) {
            if (!showNumbering) {
              heading
                .getElementsByClassName('numbering-entry')[0]
                .setAttribute('hidden', 'true');
            } else {
              heading
                .getElementsByClassName('numbering-entry')[0]
                .removeAttribute('hidden');
            }
          }
        });
      });
    }
  }

  set notebookMetadata(value: [string, any]) {
    if (this._notebook.currentWidget != null) {
      this._notebook.currentWidget.model.metadata.set(value[0], value[1]);
    }
  }

  set numbering(value: boolean) {
    this._numbering = value;
    this._widget.update();
    this.notebookMetadata = ['toc-autonumbering', this._numbering];
    this.changeNumberingStateForAllCells(this._numbering);
  }

  get numbering() {
    return this._numbering;
  }

  set showCode(value: boolean) {
    this._showCode = value;
    this.notebookMetadata = ['toc-showcode', this._showCode];
    this._widget.update();
  }

  get showCode() {
    return this._showCode;
  }

  set showMarkdown(value: boolean) {
    this._showMarkdown = value;
    this.notebookMetadata = ['toc-showmarkdowntxt', this._showMarkdown];
    this._widget.update();
  }

  get showMarkdown() {
    return this._showMarkdown;
  }

  set showTags(value: boolean) {
    this._showTags = value;
    this.notebookMetadata = ['toc-showtags', this._showTags];
    this._widget.update();
  }

  get showTags() {
    return this._showTags;
  }

  set filtered(value: string[]) {
    this._filtered = value;
    this._widget.update();
  }

  get filtered() {
    return this._filtered;
  }

  set preRenderedToolbar(value: any) {
    this._preRenderedToolbar = value;
  }

  get preRenderedToolbar() {
    return this._preRenderedToolbar;
  }

  set notebookChanged(value: boolean) {
    this._notebookChanged = value;
  }

  get notebookChanged() {
    return this._notebookChanged;
  }

  updateWidget() {
    this._widget.update();
  }

  // initialize options, will NOT change notebook metadata
  initializeOptions(
    numbering: boolean,
    showCode: boolean,
    showMarkdown: boolean,
    showTags: boolean
  ) {
    this._numbering = numbering;
    this._showCode = showCode;
    this._showMarkdown = showMarkdown;
    this._showTags = showTags;
    this._widget.update();
  }

  sanitizer: ISanitizer;
  private _preRenderedToolbar: any = null;
  private _notebookChanged: boolean;
  private _filtered: string[] = [];
  private _numbering: boolean;
  private _showCode = false;
  private _showMarkdown = false;
  private _showTags = false;
  private _notebook: INotebookTracker;
  private _widget: TableOfContents;
}
