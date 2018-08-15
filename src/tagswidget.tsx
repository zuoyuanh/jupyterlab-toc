import { Cell, ICellModel } from '@jupyterlab/cells';

import { INotebookTracker } from '@jupyterlab/notebook';

import { Widget } from '@phosphor/widgets';

import { TagsToolComponent } from './tagstool';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

export class TagsWidget extends Widget {
  constructor(notebook_Tracker: INotebookTracker) {
    super();
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

  renderAllTagLabels(tags: string[]) {
    Private.setTagsListFor(Private.ALL_TAGS, tags);
  }

  validateMetadataForActiveCell() {
    let cell = this.currentActiveCell;
    let taglist = cell.model.metadata.get('tags') as string[];
    var results: string[] = [];
    if (taglist === undefined) {
      return;
    }
    for (let i = taglist.length - 1; i >= 0; i--) {
      var found = false;
      for (let j = 0; j < i; j++) {
        if (taglist[j] === taglist[i]) {
          found = true;
          break;
        }
      }
      if (!found) {
        results.push(taglist[i]);
      }
    }
    cell.model.metadata.set('tags', results.reverse());
  }
  currentActiveCell: Cell | null = null;
  allTagsInNotebook: [string] | null = null;
  notebookTracker: INotebookTracker | null = null;
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
        //widget={widget}
        //tagsList={tagsList}
        allTagsList={allTagsList}
      />,
      widget.node
    );
  }
}
