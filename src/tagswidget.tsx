import { Cell, ICellModel } from '@jupyterlab/cells';

import { INotebookTracker } from '@jupyterlab/notebook';

import { Widget } from '@phosphor/widgets';

import { write_tag, preprocess_input, cleanup_metadata } from './celltags';

import { TagsToolComponent } from './tagstool';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

export class TagsWidget extends Widget {
  constructor(notebook_Tracker: INotebookTracker) {
    super();
    this.notebookTracker = notebook_Tracker;
    Private.setWidget(this);
    Private.renderAllTagsNode();
  }

  cellModelContainsTag(tag: string, cellModel: ICellModel) {
    let tagList = cellModel.metadata.get('tags') as string[];
    if (tagList) {
      for (let i = 0; i < tagList.length; i++) {
        if (tagList[i] === tag) {
          return true;
        }
      }
      return false;
    }
  }

  containsTag(tag: string, cell: Cell) {
    if (cell === null) {
      return false;
    }
    return this.cellModelContainsTag(tag, cell.model);
  }

  activeCellContainsTag(tag: string) {
    return this.containsTag(tag, this.currentActiveCell);
  }

  selectAll(names: string[]) {
    let notebookPanel = this.notebookTracker.currentWidget;
    let notebook = notebookPanel.content;
    let first: boolean = true;
    for (let i = 0; i < notebookPanel.model.cells.length; i++) {
      let currentCell = notebook.widgets[i] as Cell;
      for (let j = 0; j < names.length; j++) {
        if (this.containsTag(names[j], currentCell)) {
          if (first === true) {
            notebook.activeCellIndex = i;
            notebook.deselectAll();
            first = false;
          } else {
            notebook.select(notebook.widgets[i] as Cell);
          }
        }
      }
    }
  }

  addTagIntoAllTagsList(name: string) {
    if (name === '') {
      return;
    } else if (this.allTagsInNotebook == null) {
      this.allTagsInNotebook = [name];
    } else {
      if (this.allTagsInNotebook.indexOf(name) < 0) {
        this.allTagsInNotebook.push(name);
      }
    }
  }

  getAllTagsInNotebook() {
    let notebook = this.notebookTracker.currentWidget;
    let cells = notebook.model.cells;
    this.allTagsInNotebook = null;
    for (var i = 0; i < cells.length; i++) {
      let cellMetadata = cells.get(i).metadata;
      let cellTagsData = cellMetadata.get('tags') as string[];
      if (cellTagsData) {
        for (var j = 0; j < cellTagsData.length; j++) {
          let name = cellTagsData[j];
          this.addTagIntoAllTagsList(name);
        }
      }
    }
    this.renderAllTagLabels(this.allTagsInNotebook);
  }

  loadTagsForActiveCell() {
    if (this.currentActiveCell != null) {
      let tags = this.currentActiveCell.model.metadata.get('tags');
      Private.setTagsListFor(Private.TAGS_FOR_CELL, tags);
    }
  }

  renderAllTagLabels(tags: string[]) {
    Private.setTagsListFor(Private.ALL_TAGS, tags);
  }

  validateMetadataForActiveCell() {
    cleanup_metadata(this.currentActiveCell);
  }

  currentActiveCell: Cell = null;
  allTagsInNotebook: [string] = null;
  notebookTracker: INotebookTracker = null;
  tagsListShallNotRefresh = false;
}

namespace Private {
  let widget: TagsWidget = null;
  let tagsList: any = [];
  let allTagsList: any[] = [];

  export const ALL_TAGS = 0;
  export const TAGS_FOR_CELL = 1;

  export function setTagsListFor(type: number, list: any) {
    switch (type) {
      case ALL_TAGS:
        allTagsList = list;
        break;
      case TAGS_FOR_CELL:
        tagsList = list;
        break;
    }
    renderAllTagsNode();
  }

  export function setWidget(currentWidget: TagsWidget) {
    widget = currentWidget;
  }

  export function renderAllTagsNode() {
    ReactDOM.render(
      <TagsToolComponent
        widget={widget}
        tagsList={tagsList}
        allTagsList={allTagsList}
      />,
      widget.node
    );
  }
}
