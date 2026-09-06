/**
 * rmmd as a library.
 *
 * The CLI is a thin wrapper over these; import them to use the pipeline
 * directly, or to build the element registry into your own unified processor.
 */

export { render } from './render.js';
export { wrapInHtmlDocument } from './wrapHtml.js';
export { remarkSemantic } from './syntax/semantic.js';
export { remarkGfmWithoutStrikethrough } from './syntax/gfm.js';
export { inlineAttention } from './syntax/inlineAttention.js';
export {
  allElements,
  delimiterElements,
  spanElements,
  elementTags,
  selectElements,
} from './elements.js';
