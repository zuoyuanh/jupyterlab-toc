import { TagsWidget } from './tagswidget';

import { TagListComponent } from './tagslist';

import { PanelLayout } from '@phosphor/widgets';

import { CellTools, INotebookTracker } from '@jupyterlab/notebook';

import { Message } from '@phosphor/messaging';

import { ObservableJSON } from '@jupyterlab/observables';

import { JupyterLab } from '@jupyterlab/application';

import * as React from 'react';
import StyleClasses from './styles';

const TAG_TOOL_CLASS = 'jp-cellTags-Tools';
const TagsToolStyleClasses = StyleClasses.TagsToolStyleClasses;

export interface TagsToolComponentProps {
  widget: TagsWidget;
  tagsList: string | null;
  allTagsList: string[] | null;
}

export interface TagsToolComponentState {
  selected: any;
}

export class TagsToolComponent extends React.Component<any, any> {
  constructor(props: TagsToolComponentProps) {
    super(props);
    this.state = {
      selected: null
    };
    this.node = null;
  }

  componentWillMount() {
    document.addEventListener('mousedown', this.handleClick, false);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClick, false);
  }

  clickedSelectAll = () => {
    let selectedTags: string[] = [this.state.selected];
    (this.props.widget as TagsWidget).selectAll(selectedTags);
  };

  changeSelectionState = (newState: string, add: boolean) => {
    if (add) {
      let selectedTags = this.state.selected;
      selectedTags.push(newState);
      this.setState({ selected: selectedTags });
    } else {
      let selectedTags = this.state.selected;
      let newSelectedTags: string[] = [];
      for (let i = 0; i < selectedTags.length; i++) {
        if (selectedTags[i] !== newState) {
          newSelectedTags.push(selectedTags[i]);
        }
      }
      if (newSelectedTags.length === 0) {
        newSelectedTags = null;
      }
      this.setState({ selected: newSelectedTags });
    }
  };

  handleClick = (e: any) => {
    if (this.node) {
      if (this.node.contains(e.target)) {
        return;
      }
      this.node = null;
    }
  };

  render() {
    const operationClass =
      this.state.selected === null
        ? TagsToolStyleClasses.tagOperationsNoSelectedStyleClass
        : TagsToolStyleClasses.tagOperationsOptionStyleClass;
    return (
      // <TagListComponent
      //   widget={this.props.widget}
      //   allTagsList={this.props.allTagsList}
      //   selectionStateHandler={this.changeSelectionState}
      //   selectedTag={this.state.selected}
      // />
      <div>
        <div
          className={operationClass}
          onClick={event => {
            event.stopPropagation();
            this.clickedSelectAll();
          }}
        >
          Select All Cells with this Tag
        </div>
      </div>
    );
  }

  private node: any;
}

export class TagsTool extends CellTools.Tool {
  constructor(notebook_Tracker: INotebookTracker, app: JupyterLab) {
    super();
    this.notebookTracker = notebook_Tracker;
    let layout = (this.layout = new PanelLayout());
    this.addClass(TAG_TOOL_CLASS);
    this.widget = new TagsWidget(notebook_Tracker);
    layout.addWidget(this.widget);
  }

  /**
   * Handle a change to the active cell.
   */
  protected onActiveCellChanged(msg: Message): void {
    this.widget.currentActiveCell = this.parent.activeCell;
    this.widget.loadTagsForActiveCell();
  }

  protected onAfterShow() {
    this.widget.getAllTagsInNotebook();
  }

  protected onAfterAttach() {
    this.notebookTracker.currentWidget.context.ready.then(() => {
      this.widget.getAllTagsInNotebook();
    });
    this.notebookTracker.currentChanged.connect(() => {
      this.widget.getAllTagsInNotebook();
    });
    this.notebookTracker.currentWidget.model.cells.changed.connect(() => {
      this.widget.getAllTagsInNotebook();
    });
  }

  protected onMetadataChanged(msg: ObservableJSON.ChangeMessage): void {
    if (!this.widget.tagsListShallNotRefresh) {
      this.widget.validateMetadataForActiveCell();
      this.widget.loadTagsForActiveCell();
      this.widget.getAllTagsInNotebook();
    }
  }

  private widget: TagsWidget = null;
  public notebookTracker: INotebookTracker = null;
}
