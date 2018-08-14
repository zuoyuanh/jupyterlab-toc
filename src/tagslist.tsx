import {
  TagComponent,
  TagForActiveCellComponent,
  TagForAllCellsComponent,
  AddTagComponent
} from './tag';

import { TagsWidget } from './tagswidget';

import { EditingStates } from './tagstool';

import * as React from 'react';
import StyleClasses from './styles';

const TagListStyleClasses = StyleClasses.TagListStyleClasses;

export interface TagListComponentProps {
  widget: TagsWidget;
  selectedTag: string | null;
  editingSelectedTag: EditingStates;
  selectionStateHandler: (newState: string) => void;
  allTagsList: string[] | null;
  tagsList: string | null;
}

export interface TagListComponentState {
  selected: string | null;
}

export class TagListComponent extends React.Component<any, any> {
  constructor(props: TagListComponentProps) {
    super(props);
    this.state = { selected: this.props.selectedTag };
  }

  selectedTagWithName = (name: string) => {
    if (this.props.selectedTag === name) {
      this.props.selectionStateHandler(null);
    } else {
      this.props.selectionStateHandler(name);
    }
  };

  tagInActiveCell = (name: string) => {
    return this.props.widget.activeCellContainsTag(name);
  };

  renderElementForTags = (
    tags: string[],
    TagType: typeof TagComponent,
    doubleClickAllowed: boolean
  ) => {
    const selectedTag = this.props.selectedTag;
    const _self = this;
    return tags.map((tag, index) => {
      const tagClass =
        selectedTag === tag
          ? TagListStyleClasses.selectedTagStyleClass
          : TagListStyleClasses.unselectedTagStyleClass;
      const inputShouldShow =
        selectedTag === tag &&
        this.props.editingSelectedTag != EditingStates.none;
      return (
        <div
          key={tag}
          className={tagClass}
          onClick={event => {
            _self.selectedTagWithName(tag);
          }}
          tabIndex={-1}
        >
          <TagType
            widget={this.props.widget}
            selectionStateHandler={this.props.selectionStateHandler}
            selectedTag={this.props.selectedTag}
            tag={tag}
          />
        </div>
      );
    });
  };

  render() {
    let allTagsList = this.props.allTagsList;
    let otherTagsList: string[] = [];
    if (allTagsList) {
      for (let i = 0; i < allTagsList.length; i++) {
        if (!this.tagInActiveCell(allTagsList[i])) {
          otherTagsList.push(allTagsList[i]);
        }
      }
    }
    var renderedTagsForAllCells = null;
    if (otherTagsList != null) {
      renderedTagsForAllCells = this.renderElementForTags(
        otherTagsList,
        TagForAllCellsComponent,
        false
      );
    }
    var renderedTagsForActiveCell = null;
    if (this.props.tagsList != null) {
      let tags = (this.props.tagsList as string).toString().split(',');
      renderedTagsForActiveCell = this.renderElementForTags(
        tags,
        TagForActiveCellComponent,
        true
      );
    }
    return (
      <div>
        <div className={TagListStyleClasses.tagSubHeaderStyleClass}>
          Tags in Active Cell
        </div>
        <div className={TagListStyleClasses.tagHolderStyleClass}>
          {renderedTagsForActiveCell}
        </div>
        <div className={TagListStyleClasses.tagSubHeaderStyleClass}>
          Other Tags in Notebook
        </div>
        <div>
          <div className={TagListStyleClasses.tagHolderStyleClass}>
            {renderedTagsForAllCells}
          </div>
        </div>
      </div>
    );
  }
}
