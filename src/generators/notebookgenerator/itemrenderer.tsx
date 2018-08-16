// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { CodeComponent } from './codemirror';

import { Cell } from '@jupyterlab/cells';

import { NotebookGeneratorOptionsManager } from './optionsmanager';

import { SharedConstants, INotebookHeading } from '../shared';

import * as React from 'react';

export function notebookItemRenderer(
  options: NotebookGeneratorOptionsManager,
  item: INotebookHeading
) {
  const levelsSizes: { [level: number]: string } = {
    1: '18.74',
    2: '16.02',
    3: '13.69',
    4: '12',
    5: '11',
    6: '10'
  };
  let jsx;
  if (item.type === 'markdown' || item.type === 'header') {
    const paddingLeft = 24;
    const collapseOnClick = (cellRef?: Cell) => {
      let collapsed = cellRef!.model.metadata.get(
        'toc-hr-collapsed'
      ) as boolean;
      collapsed = collapsed != undefined ? collapsed : false;
      cellRef!.model.metadata.set('toc-hr-collapsed', !collapsed);
      options.updateWidget();
    };
    let fontSize = '9px';
    let numbering = item.numbering && options.numbering ? item.numbering : '';
    if (item.type === 'header') {
      fontSize = levelsSizes[item.level] + 'px';
    }
    if (item.html && (item.type === 'header' || options.showMarkdown)) {
      jsx = (
        <span
          dangerouslySetInnerHTML={{
            __html:
              numbering +
              options.sanitizer.sanitize(
                item.html,
                SharedConstants.sanitizerOptions
              )
          }}
          className={item.type + '-cell'}
          style={{ fontSize, paddingLeft }}
        />
      );
      if (item.type === 'header') {
        let collapsed = item.cellRef!.model.metadata.get(
          'toc-hr-collapsed'
        ) as boolean;
        collapsed = collapsed != undefined ? collapsed : false;
        let twistButton = (
          <div
            className="toc-collapse-button"
            onClick={event => {
              event.stopPropagation();
              collapseOnClick(item.cellRef);
            }}
          >
            <div className="toc-twist-placeholder">placeholder</div>
            <img
              className="toc-arrow-img"
              src={require('../../../static/downarrow.svg')}
            />
          </div>
        );
        if (collapsed) {
          twistButton = (
            <div
              className="toc-collapse-button"
              onClick={event => {
                event.stopPropagation();
                collapseOnClick(item.cellRef);
              }}
            >
              <div className="toc-twist-placeholder">placeholder</div>
              <img
                className="toc-arrow-img"
                src={require('../../../static/rightarrow.svg')}
              />
            </div>
          );
        }
        jsx = (
          <div className="toc-entry-holder">
            {item.hasChild && twistButton}
            {jsx}
          </div>
        );
      }
    } else if (item.type === 'header' || options.showMarkdown) {
      jsx = (
        <span className={item.type + '-cell'} style={{ fontSize, paddingLeft }}>
          {numbering + item.text}
        </span>
      );
      if (item.type === 'header') {
        let collapsed = item.cellRef!.model.metadata.get(
          'toc-hr-collapsed'
        ) as boolean;
        collapsed = collapsed != undefined ? collapsed : false;
        let twistButton = (
          <div
            className="toc-collapse-button"
            onClick={event => {
              event.stopPropagation();
              collapseOnClick(item.cellRef);
            }}
          >
            <div className="toc-twist-placeholder">placeholder</div>
            <img
              className="toc-arrow-img"
              src={require('../../../static/downarrow.svg')}
            />
          </div>
        );
        if (collapsed) {
          twistButton = (
            <div
              className="toc-collapse-button"
              onClick={event => {
                event.stopPropagation();
                collapseOnClick(item.cellRef);
              }}
            >
              <div className="toc-twist-placeholder">placeholder</div>
              <img
                className="toc-arrow-img"
                src={require('../../../static/rightarrow.svg')}
              />
            </div>
          );
        }
        jsx = (
          <div className="toc-entry-holder">
            {item.hasChild && twistButton}
            {jsx}
          </div>
        );
      }
    } else {
      jsx = null;
    }
  } else if (item.type === 'code' && options.showCode) {
    jsx = (
      <div className="toc-code-cell-div">
        <div className="toc-code-cell-prompt">{item.prompt}</div>
        <span className={'toc-code-span'}>
          <CodeComponent heading={item} />
        </span>
      </div>
    );
  } else {
    jsx = null;
  }
  return jsx;
}