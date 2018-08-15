import { TagComponent } from './tag';

import { TagsWidget } from './tagswidget';

import * as React from 'react';
import StyleClasses from './styles';

const TagListStyleClasses = StyleClasses.TagListStyleClasses;

export interface TagListComponentProps {
  widget: TagsWidget;
  selectedTags: string[] | null;
  selectionStateHandler: (newState: string) => void;
  allTagsList: string[] | null;
  tagsList: string | null;
}

export interface TagListComponentState {
  selected: string[] | null;
}

export class TagListComponent extends React.Component<any, any> {
  constructor(props: TagListComponentProps) {
    super(props);
    this.state = { selected: this.props.selectedTags };
  }

  selectedTagWithName = (name: string) => {
    if (this.props.selectedTags.indexOf(name) >= 0) {
      this.props.selectionStateHandler(name, false);
    } else {
      this.props.selectionStateHandler(name, true);
    }
  };

  renderElementForTags = (tags: string[]) => {
    const selectedTags = this.props.selectedTags;
    const _self = this;
    return tags.map((tag, index) => {
      const tagClass =
        selectedTags.indexOf(tag) >= 0
          ? TagListStyleClasses.selectedTagStyleClass
          : TagListStyleClasses.unselectedTagStyleClass;
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
            selectedTags={this.props.selectedTags}
            tag={tag}
          />
        </div>
      );
    });
  };

  render() {
    let allTagsList = this.props.allTagsList;
    var renderedTagsForAllCells = null;
    if (allTagsList) {
      renderedTagsForAllCells = this.renderElementForTags(allTagsList);
    }
    return (
      <div className={TagListStyleClasses.tagHolderStyleClass}>
        {renderedTagsForAllCells}
      </div>
    );
  }
}
