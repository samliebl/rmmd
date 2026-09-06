/**
 * `[text]{tag}` -- a generic span for semantic elements that either carry an
 * attribute or are too rare to deserve a delimiter of their own.
 *
 *     [The Waste Land]{cite}                  <cite>The Waste Land</cite>
 *     [to be or not to be]{q}                 <q>to be or not to be</q>
 *     [HTML]{abbr HyperText Markup Language}  <abbr title="HyperText Markup Language">HTML</abbr>
 *
 * The label is parsed as ordinary Markdown, so `[a **b**]{cite}` keeps its
 * emphasis. An unrecognized tag is left alone as literal text, so this syntax
 * never eats bracket-and-brace text it does not own.
 */

import { asciiAlpha, markdownLineEnding, markdownSpace } from 'micromark-util-character';
import { codes } from 'micromark-util-symbol';

/**
 * @param {object} options
 * @param {Map<string, {tag: string, attribute: string | null}>} options.tags
 *   Recognized tag names, by name.
 * @returns {import('micromark-util-types').Extension}
 */
export function span({ tags }) {
  const tokenizer = { name: 'rmmdSpan', tokenize: tokenizeSpan };

  return {
    text: { [codes.leftSquareBracket]: tokenizer },
  };

  /** @type {import('micromark-util-types').Tokenizer} */
  function tokenizeSpan(effects, ok, nok) {
    const self = this;
    let labelSize = 0;

    return start;

    function start(code) {
      effects.enter('rmmdSpan');
      effects.enter('rmmdSpanMarker');
      effects.consume(code);
      effects.exit('rmmdSpanMarker');
      // `contentType: text` is what lets the label hold full inline Markdown.
      effects.enter('rmmdSpanLabel', { contentType: 'text' });
      return labelBreak;
    }

    function labelBreak(code) {
      if (code === codes.eof || labelSize > 999) return nok(code);

      if (code === codes.rightSquareBracket) {
        // An empty label is not a span.
        if (labelSize === 0) return nok(code);
        effects.exit('rmmdSpanLabel');
        effects.enter('rmmdSpanMarker');
        effects.consume(code);
        effects.exit('rmmdSpanMarker');
        return afterLabel;
      }

      if (markdownLineEnding(code)) return nok(code);

      if (code === codes.backslash) {
        labelSize++;
        effects.consume(code);
        return labelEscape;
      }

      labelSize++;
      effects.consume(code);
      return labelBreak;
    }

    function labelEscape(code) {
      if (code === codes.eof || markdownLineEnding(code)) return nok(code);
      labelSize++;
      effects.consume(code);
      return labelBreak;
    }

    function afterLabel(code) {
      // The label must be followed immediately by `{`.
      if (code !== codes.leftCurlyBrace) return nok(code);
      effects.enter('rmmdSpanAttrMarker');
      effects.consume(code);
      effects.exit('rmmdSpanAttrMarker');
      return beforeTag;
    }

    function beforeTag(code) {
      if (!asciiAlpha(code)) return nok(code);
      effects.enter('rmmdSpanTag');
      effects.consume(code);
      return inTag;
    }

    function inTag(code) {
      if (asciiAlpha(code)) {
        effects.consume(code);
        return inTag;
      }

      const token = effects.exit('rmmdSpanTag');
      const name = self.sliceSerialize(token);

      // Unknown tag: not ours. Back out and leave the text alone.
      if (!tags.has(name)) return nok(code);

      const element = tags.get(name);

      if (code === codes.rightCurlyBrace) return close(code);

      // A value is only meaningful for elements that take an attribute.
      if (markdownSpace(code) && element.attribute) {
        effects.enter('rmmdSpanValueWhitespace');
        return beforeValue(code);
      }

      return nok(code);
    }

    function beforeValue(code) {
      if (markdownSpace(code)) {
        effects.consume(code);
        return beforeValue;
      }
      effects.exit('rmmdSpanValueWhitespace');
      if (code === codes.eof || code === codes.rightCurlyBrace) return nok(code);
      effects.enter('rmmdSpanValue');
      return inValue;
    }

    function inValue(code) {
      if (code === codes.eof || markdownLineEnding(code)) return nok(code);

      if (code === codes.rightCurlyBrace) {
        effects.exit('rmmdSpanValue');
        return close(code);
      }

      effects.consume(code);
      return inValue;
    }

    function close(code) {
      effects.enter('rmmdSpanAttrMarker');
      effects.consume(code);
      effects.exit('rmmdSpanAttrMarker');
      effects.exit('rmmdSpan');
      return ok;
    }
  }
}

/**
 * mdast extension for the span tokens.
 * @param {Map<string, {tag: string, attribute: string | null}>} tags
 */
export function spanFromMarkdown(tags) {
  return {
    canContainEols: ['rmmdSpan'],
    enter: {
      rmmdSpan(token) {
        this.enter({ type: 'rmmdSpan', children: [], data: {} }, token);
      },
    },
    exit: {
      rmmdSpanTag(token) {
        this.stack[this.stack.length - 1]._tag = this.sliceSerialize(token);
      },
      rmmdSpanValue(token) {
        this.stack[this.stack.length - 1]._value = this.sliceSerialize(token);
      },
      rmmdSpan(token) {
        const node = this.stack[this.stack.length - 1];
        const element = tags.get(node._tag);

        node.data.hName = element.tag;

        if (element.attribute && node._value) {
          // hProperties are escaped by rehype on the way out.
          node.data.hProperties = { [element.attribute]: node._value };
        }

        delete node._tag;
        delete node._value;

        this.exit(token);
      },
    },
  };
}
