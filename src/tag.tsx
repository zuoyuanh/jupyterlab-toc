import { TagsWidget } from './tagswidget';

import * as React from 'react';
import StyleClasses from './styles';

const TagStyleClasses = StyleClasses.TagStyleClasses;

export interface TagComponentProps {
  widget: TagsWidget;
  selectionStateHandler: (newState: string) => void;
  selectedTags: string[] | null;
  tag: string;
}

export abstract class TagComponent extends React.Component<TagComponentProps> {
  constructor(props: TagComponentProps) {
    super(props);
  }

  render() {
    const tag = this.props.tag as string;
    return (
      <div>
        <label
          className={TagStyleClasses.tagLabelStyleClass}
          key={new Date().toLocaleTimeString()}
          //onFocus={event => document.execCommand('selectAll', false, null)}
        >
          {tag}
        </label>
      </div>
    );
  }
}
