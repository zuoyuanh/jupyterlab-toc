// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { ISanitizer } from '@jupyterlab/apputils';

import {
  CodeCell,
  CodeCellModel,
  MarkdownCell,
  Cell,
  ICellModel
} from '@jupyterlab/cells';

import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

import { notebookItemRenderer } from './itemrenderer';

import { notebookGeneratorToolbar } from './toolbargenerator';

import { TableOfContentsRegistry } from '../../registry';

import { TableOfContents } from '../../toc';

import { NotebookGeneratorOptionsManager } from './optionsmanager';

import {
  generateNumbering,
  getMarkdownHeadings,
  isDOM,
  isMarkdown,
  INotebookHeading,
  INotebookHeadingTypes,
  sanitizerOptions
} from '../shared';

/**
 * Create a TOC generator for notebooks.
 *
 * @param tracker: A notebook tracker.
 *
 * @returns A TOC generator that can parse notebooks.
 */
export function createNotebookGenerator(
  tracker: INotebookTracker,
  sanitizer: ISanitizer,
  widget: TableOfContents
): TableOfContentsRegistry.IGenerator<NotebookPanel> {
  // Create a option manager to manage user settings
  const options = new NotebookGeneratorOptionsManager(widget, tracker, {
    needsNumbering: true,
    sanitizer: sanitizer
  });
  return {
    tracker,
    usesLatex: true,
    options: options,
    toolbarGenerator: () => {
      return notebookGeneratorToolbar(options, tracker);
    },
    itemRenderer: (item: INotebookHeading) => {
      return notebookItemRenderer(options, item);
    },
    generate: panel => {
      let headings: INotebookHeading[] = [];
      let numberingDict: { [level: number]: number } = {};
      let currentCollapseLevel = -1;

      // Keep track of the previous heading that is shown in TOC, used for
      // determine whether one header has child
      let prevHeading: INotebookHeading | null = null;
      let cellNum = panel.content.widgets.length;
      for (var i = 0; i <= panel.content.widgets.length; i++) {
        let cell: Cell | null = null;
        if (i != cellNum) {
          cell = panel.content.widgets[i];
        }
        let collapsed = false;
        if (cell) {
          collapsed = cell!.model.metadata.get('toc-hr-collapsed') as boolean;
        }
        collapsed = collapsed != undefined ? collapsed : false;
        let model: ICellModel | null = null;
        if (cell) {
          model = cell.model;
        }
        if (cell && model && model.type === 'code' && i != cellNum) {
          // Get the execution count prompt for code cells
          let executionCountNumber = (cell as CodeCell).model
            .executionCount as number;
          let executionCount =
            executionCountNumber != null
              ? '[' + executionCountNumber + ']: '
              : '[ ]: ';
          // Iterate over the outputs, and parse them if they
          // are rendered markdown or HTML.
          let showCode = true;
          if (widget) {
            showCode = options.showCode;
          }
          if (showCode) {
            let text = (model as CodeCellModel).value.text;
            const onClickFactory = (line: number) => {
              // Activate the corresponding cell if user click on the TOC entry
              return () => {
                cell!.node.scrollIntoView();
                if (tracker && tracker.currentWidget) {
                  let cells = tracker.currentWidget.model.cells;
                  for (let i = 0; i < cells.length; i++) {
                    let currCell = tracker.currentWidget.content.widgets[
                      i
                    ] as Cell;
                    if (cell === currCell) {
                      tracker.currentWidget.content.activeCellIndex = i;
                    }
                  }
                }
              };
            };
            let lastLevel = Private.getLastLevel(headings);
            let renderedHeadings = Private.getCodeCells(
              text,
              onClickFactory,
              numberingDict,
              executionCount,
              lastLevel,
              cell
            );

            // // Do not render the code cell in TOC if it is filtered out by tags
            if (
              currentCollapseLevel < 0 &&
              !Private.headingIsFilteredOut(
                renderedHeadings[0],
                options.filtered
              )
            ) {
              headings = headings.concat(renderedHeadings);
            }

            // Keep a copy of the TOC entry in prevHeadings
            if (
              !Private.headingIsFilteredOut(
                renderedHeadings[0],
                options.filtered
              )
            ) {
              prevHeading = renderedHeadings[0];
            }
          }
          for (let i = 0; i < (model as CodeCellModel).outputs.length; i++) {
            // Filter out the outputs that are not rendered HTML
            // (that is, markdown, vdom, or text/html)
            const outputModel = (model as CodeCellModel).outputs.get(i);
            const dataTypes = Object.keys(outputModel.data);
            const htmlData = dataTypes.filter(t => isMarkdown(t) || isDOM(t));
            if (!htmlData.length) {
              continue;
            }
            // If the output has rendered HTML, parse it for headers.
            const outputWidget = (cell as CodeCell).outputArea.widgets[i];
            const onClickFactory = (el: Element) => {
              return () => {
                el.scrollIntoView();
                if (tracker && tracker.currentWidget) {
                  let cells = tracker.currentWidget.model.cells;
                  for (let i = 0; i < cells.length; i++) {
                    let currCell = tracker.currentWidget.content.widgets[
                      i
                    ] as Cell;
                    if (cell === currCell) {
                      tracker.currentWidget.content.activeCellIndex = i;
                    }
                  }
                }
              };
            };
            let lastLevel = Private.getLastLevel(headings);
            let numbering = options.numbering;
            let renderedHeadings = Private.getRenderedHTMLHeadings(
              outputWidget.node,
              onClickFactory,
              sanitizer,
              numberingDict,
              lastLevel,
              numbering,
              cell
            );
            let renderedHeading = renderedHeadings[0];
            if (
              renderedHeading &&
              renderedHeading.type === INotebookHeadingTypes.markdown
            ) {
              // Do not put the item in TOC if its filtered out by tags
              if (
                currentCollapseLevel < 0 &&
                !Private.headingIsFilteredOut(
                  renderedHeadings[0],
                  options.filtered
                )
              ) {
                headings = headings.concat(renderedHeadings);
              }
            } else if (
              renderedHeading &&
              renderedHeading.type === INotebookHeadingTypes.header
            ) {
              // Determine whether the heading has children
              if (
                prevHeading &&
                prevHeading.type === INotebookHeadingTypes.header &&
                prevHeading.level >= renderedHeading.level
              ) {
                prevHeading.hasChild = false;
              }
              // Do not put the item in TOC if its header is collapsed
              // or filtered out by tags
              if (
                (currentCollapseLevel >= renderedHeading.level ||
                  currentCollapseLevel < 0) &&
                !Private.headingIsFilteredOut(
                  renderedHeadings[0],
                  options.filtered
                )
              ) {
                headings = headings.concat(renderedHeadings);
                if (collapsed) {
                  currentCollapseLevel = renderedHeading.level;
                } else {
                  currentCollapseLevel = -1;
                }
              } else {
                if (
                  Private.headingIsFilteredOut(
                    renderedHeadings[0],
                    options.filtered
                  )
                ) {
                  currentCollapseLevel = -1;
                }
              }
            }
            if (
              renderedHeadings[0] &&
              !Private.headingIsFilteredOut(
                renderedHeadings[0],
                options.filtered
              )
            ) {
              if (
                !(renderedHeading.type === INotebookHeadingTypes.markdown) ||
                options.showMarkdown
              ) {
                prevHeading = renderedHeading;
              }
            }
          }
        } else if ((model && model.type === 'markdown') || i == cellNum) {
          // If the cell is rendered, generate the ToC items from
          // the HTML. If it is not rendered, generate them from
          // the text of the cell.
          if (
            i == cellNum ||
            ((cell as MarkdownCell).rendered &&
              !(cell as MarkdownCell).inputHidden)
          ) {
            const onClickFactory = (el: Element) => {
              return () => {
                if (!cell) {
                  return;
                }
                if (!(cell as MarkdownCell).rendered) {
                  cell.node.scrollIntoView();
                } else {
                  el.scrollIntoView();
                  if (tracker && tracker.currentWidget) {
                    let cells = tracker.currentWidget.model.cells;
                    for (let i = 0; i < cells.length; i++) {
                      let currCell = tracker.currentWidget.content.widgets[
                        i
                      ] as Cell;
                      if (cell === currCell) {
                        tracker.currentWidget.content.activeCellIndex = i;
                      }
                    }
                  }
                }
              };
            };
            let numbering = options.numbering;
            let lastLevel = Private.getLastLevel(headings);
            let renderedHeadings: INotebookHeading[] = [];
            let renderedHeading: INotebookHeading | null = null;
            if (i != cellNum) {
              renderedHeadings = Private.getRenderedHTMLHeadings(
                cell!.node,
                onClickFactory,
                sanitizer,
                numberingDict,
                lastLevel,
                numbering,
                cell!
              );
              renderedHeading = renderedHeadings[0];
            }
            if (
              renderedHeading &&
              renderedHeading.type === INotebookHeadingTypes.markdown
            ) {
              // Do not put the item in TOC if its filtered out by tags
              if (
                currentCollapseLevel < 0 &&
                !Private.headingIsFilteredOut(
                  renderedHeadings[0],
                  options.filtered
                )
              ) {
                headings = headings.concat(renderedHeadings);
              }
            } else if (
              (renderedHeading &&
                renderedHeading.type === INotebookHeadingTypes.header) ||
              !renderedHeading
            ) {
              // Determine whether the heading has children
              if (
                prevHeading &&
                prevHeading.type === INotebookHeadingTypes.header &&
                (i === cellNum ||
                  (renderedHeading &&
                    prevHeading.level >= renderedHeading.level))
              ) {
                prevHeading.hasChild = false;
              }
              // Do not put the item in TOC if its header is collapsed
              // or filtered out by tags
              if (
                renderedHeading &&
                (currentCollapseLevel >= renderedHeading.level ||
                  currentCollapseLevel < 0) &&
                !Private.headingIsFilteredOut(
                  renderedHeadings[0],
                  options.filtered
                )
              ) {
                headings = headings.concat(renderedHeadings);
                if (collapsed) {
                  currentCollapseLevel = renderedHeading.level;
                } else {
                  currentCollapseLevel = -1;
                }
              } else {
                if (
                  Private.headingIsFilteredOut(
                    renderedHeadings[0],
                    options.filtered
                  )
                ) {
                  currentCollapseLevel = -1;
                }
              }
            }
            if (
              renderedHeadings[0] &&
              !Private.headingIsFilteredOut(
                renderedHeadings[0],
                options.filtered
              )
            ) {
              if (
                (renderedHeading &&
                  !(renderedHeading.type === INotebookHeadingTypes.markdown)) ||
                options.showMarkdown
              ) {
                prevHeading = renderedHeading;
              }
            }
          } else {
            const onClickFactory = (line: number) => {
              return () => {
                if (!cell) {
                  return;
                }
                cell.node.scrollIntoView();
                if (!(cell as MarkdownCell).rendered) {
                  cell.editor.setCursorPosition({ line, column: 0 });
                }
                if (tracker && tracker.currentWidget) {
                  let cells = tracker.currentWidget.model.cells;
                  for (let i = 0; i < cells.length; i++) {
                    let currCell = tracker.currentWidget.content.widgets[
                      i
                    ] as Cell;
                    if (cell === currCell) {
                      tracker.currentWidget.content.activeCellIndex = i;
                    }
                  }
                }
              };
            };
            let lastLevel = Private.getLastLevel(headings);
            let renderedHeadings: INotebookHeading[] = [];
            let renderedHeading: INotebookHeading | null = null;
            if (cell) {
              renderedHeadings = getMarkdownHeadings(
                model!.value.text,
                onClickFactory,
                numberingDict,
                lastLevel,
                cell
              );
              renderedHeading = renderedHeadings[0];
            }
            if (
              renderedHeading &&
              renderedHeading.type === INotebookHeadingTypes.markdown
            ) {
              if (
                renderedHeading &&
                currentCollapseLevel < 0 &&
                !Private.headingIsFilteredOut(
                  renderedHeadings[0],
                  options.filtered
                )
              ) {
                headings = headings.concat(renderedHeadings);
              }
            } else if (
              renderedHeading &&
              renderedHeading.type === INotebookHeadingTypes.header
            ) {
              // Determine whether the heading has children
              if (
                prevHeading &&
                prevHeading.type === INotebookHeadingTypes.header &&
                (i === cellNum || prevHeading.level >= renderedHeading.level)
              ) {
                prevHeading.hasChild = false;
              }
              // Do not put the item in TOC if its header is collapsed
              // or filtered out by tags
              if (
                renderedHeading &&
                (currentCollapseLevel >= renderedHeading.level ||
                  currentCollapseLevel < 0) &&
                !Private.headingIsFilteredOut(
                  renderedHeadings[0],
                  options.filtered
                )
              ) {
                headings = headings.concat(renderedHeadings);
                if (collapsed) {
                  currentCollapseLevel = renderedHeading.level;
                } else {
                  currentCollapseLevel = -1;
                }
              } else {
                if (
                  renderedHeading &&
                  Private.headingIsFilteredOut(
                    renderedHeadings[0],
                    options.filtered
                  )
                ) {
                  currentCollapseLevel = -1;
                }
              }
            }
          }
        }
      }
      return headings;
    }
  };
}

/**
 * A private namespace for miscellaneous things.
 */
namespace Private {
  /**
   * Given a heading and the tags user selected,
   * determine whether the heading is filtered out by these tags.
   */
  export function headingIsFilteredOut(
    heading: INotebookHeading,
    tags: string[]
  ) {
    if (tags.length === 0) {
      return false;
    }
    if (heading && heading.cellRef) {
      let cellMetadata = heading.cellRef.model.metadata;
      let cellTagsData = cellMetadata.get('tags') as string[];
      if (cellTagsData) {
        for (var j = 0; j < cellTagsData.length; j++) {
          let name = cellTagsData[j];
          for (var k = 0; k < tags.length; k++) {
            if (tags[k] === name) {
              return false;
            }
          }
        }
        return true;
      }
      return true;
    }
    return true;
  }

  export function getLastLevel(headings: INotebookHeading[]) {
    if (headings.length > 0) {
      let location = headings.length - 1;
      while (location >= 0) {
        if (headings[location].type === INotebookHeadingTypes.header) {
          return headings[location].level;
        }
        location = location - 1;
      }
    }
    return 0;
  }

  /**
   * Given a string of code, get the code entry.
   */
  export function getCodeCells(
    text: string,
    onClickFactory: (line: number) => (() => void),
    numberingDict: { [level: number]: number },
    executionCount: string,
    lastLevel: number,
    cellRef: Cell
  ): INotebookHeading[] {
    let headings: INotebookHeading[] = [];
    if (text) {
      const lines = text.split('\n');
      let headingText = '';

      // Take at most first 3 lines
      let numLines = Math.min(lines.length, 3);
      for (let i = 0; i < numLines - 1; i++) {
        headingText = headingText + lines[i] + '\n';
      }
      headingText = headingText + lines[numLines - 1];
      const onClick = onClickFactory(0);
      const level = lastLevel + 1;
      headings.push({
        text: headingText,
        level,
        onClick,
        type: INotebookHeadingTypes.code,
        prompt: executionCount,
        cellRef: cellRef,
        hasChild: false
      });
    }
    return headings;
  }
}

namespace Private {
  /**
   * Given an HTML element, generate ToC headings
   * by finding all the headers and making IHeading objects for them.
   */
  export function getRenderedHTMLHeadings(
    node: HTMLElement,
    onClickFactory: (el: Element) => (() => void),
    sanitizer: ISanitizer,
    numberingDict: { [level: number]: number },
    lastLevel: number,
    needsNumbering = false,
    cellRef?: Cell
  ): INotebookHeading[] {
    let headings: INotebookHeading[] = [];
    let headingNodes = node.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
    if (headingNodes.length > 0) {
      let markdownCell = headingNodes[0];
      if (markdownCell.nodeName.toLowerCase() === 'p') {
        if (markdownCell.innerHTML) {
          let html = sanitizer.sanitize(
            markdownCell.innerHTML,
            sanitizerOptions
          );
          html = html.replace('¶', '');
          headings.push({
            level: lastLevel + 1,
            html: html,
            text: markdownCell.textContent ? markdownCell.textContent : '',
            onClick: onClickFactory(markdownCell),
            type: INotebookHeadingTypes.markdown,
            cellRef: cellRef,
            hasChild: true
          });
        }
      } else {
        const heading = headingNodes[0];
        const level = parseInt(heading.tagName[1]);
        const text = heading.textContent ? heading.textContent : '';
        let shallHide = !needsNumbering;
        if (heading.getElementsByClassName('numbering-entry').length > 0) {
          heading.removeChild(
            heading.getElementsByClassName('numbering-entry')[0]
          );
        }
        let html = sanitizer.sanitize(heading.innerHTML, sanitizerOptions);
        html = html.replace('¶', ''); // Remove the anchor symbol.
        const onClick = onClickFactory(heading);
        let numbering = generateNumbering(numberingDict, level);
        let numDOM = '';
        if (!shallHide) {
          numDOM = '<span class="numbering-entry">' + numbering + '</span>';
        }
        heading.innerHTML = numDOM + html;
        headings.push({
          level,
          text,
          numbering,
          html,
          onClick,
          type: INotebookHeadingTypes.header,
          cellRef: cellRef,
          hasChild: true
        });
      }
    }
    return headings;
  }
}
