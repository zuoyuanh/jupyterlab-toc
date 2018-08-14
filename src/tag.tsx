import { TagsWidget } from './tagswidget';

import * as React from 'react';
import StyleClasses from './styles';

const TagStyleClasses = StyleClasses.TagStyleClasses;

export interface TagComponentProps {
  widget: TagsWidget;
  selectionStateHandler: (newState: string) => void;
  selectedTag: string | null;
  tag: string;
}

export abstract class TagComponent extends React.Component<
  TagComponentProps,
  TagComponentState
> {
  constructor(props: TagComponentProps) {
    super(props);
  }

  abstract singleCellOperationHandler(name: string): void;
  abstract singleCellOperationButton(
    name: string,
    operation: (event: React.MouseEvent<any>) => void
  ): JSX.Element;

  render() {
    const tag = this.props.tag as string;
    return (
      <div>
        <label
          className={TagStyleClasses.tagLabelStyleClass}
          ref={label => inputShouldShow && label && label.focus()}
          contentEditable={false}
          suppressContentEditableWarning={true}
          key={new Date().toLocaleTimeString()}
          onFocus={event => document.execCommand('selectAll', false, null)}
          onKeyDown={event => {
            if (event.keyCode == 13) {
              let value = (event.target as HTMLLabelElement).innerHTML;
              this.props.finishEditingHandler(value);
            }
          }}
        >
          {tag}
        </label>
        <label className={TagStyleClasses.tagIconLabelStyleClass}>
          {this.singleCellOperationButton(
            tag,
            (event: React.MouseEvent<any>) => {
              event.stopPropagation();
              this.singleCellOperationHandler(tag);
            }
          )}
        </label>
      </div>
    );
  }
}
