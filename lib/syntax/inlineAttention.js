/**
 * A generic micromark extension: paired runs of a delimiter character that
 * wrap their content in a semantic HTML inline element.
 *
 * This is the engine behind rmmd's custom syntax. Every element in the registry
 * (`==mark==`, `++dfn++`, `~~s~~`, `^^sup^^`, ...) is one call to this factory,
 * so they all inherit identical pairing, nesting and flanking behavior.
 *
 * Adapted from micromark-extension-gfm-strikethrough, generalized over the
 * marker character and token name.
 */

import { splice } from 'micromark-util-chunked';
import { classifyCharacter } from 'micromark-util-classify-character';
import { resolveAll } from 'micromark-util-resolve-all';
import { codes, constants, types } from 'micromark-util-symbol';

/**
 * @param {object} options
 * @param {string} options.marker - The delimiter character, e.g. '='.
 * @param {string} options.name - Token/node name, e.g. 'mark'.
 * @param {number} [options.minSize=1] - Shortest run of markers that may pair.
 * @param {number} [options.maxSize=2] - Longest run of markers that may pair.
 * @returns {import('micromark-util-types').Extension}
 */
export function inlineAttention({ marker, name, minSize = 1, maxSize = 2 }) {
  const code = marker.codePointAt(0);
  const sequence = name + 'Sequence';
  const temporary = sequence + 'Temporary';
  const textName = name + 'Text';

  const tokenizer = {
    name,
    tokenize: tokenizeAttention,
    resolveAll: resolveAllAttention,
  };

  return {
    text: { [code]: tokenizer },
    insideSpan: { null: [tokenizer] },
    attentionMarkers: { null: [code] },
  };

  /**
   * Pair up opening and closing runs of the marker, wrapping what lies between
   * them in a token named after the element.
   *
   * @type {import('micromark-util-types').Resolver}
   */
  function resolveAllAttention(events, context) {
    let index = -1;

    while (++index < events.length) {
      // Find a run that is able to close.
      if (
        events[index][0] === 'enter' &&
        events[index][1].type === temporary &&
        events[index][1]._close
      ) {
        let open = index;

        // Walk backwards for a run that is able to open it.
        while (open--) {
          if (
            events[open][0] === 'exit' &&
            events[open][1].type === temporary &&
            events[open][1]._open &&
            // Opener and closer must be the same length.
            events[index][1].end.offset - events[index][1].start.offset ===
              events[open][1].end.offset - events[open][1].start.offset
          ) {
            events[index][1].type = sequence;
            events[open][1].type = sequence;

            const element = {
              type: name,
              start: Object.assign({}, events[open][1].start),
              end: Object.assign({}, events[index][1].end),
            };

            const text = {
              type: textName,
              start: Object.assign({}, events[open][1].end),
              end: Object.assign({}, events[index][1].start),
            };

            const nextEvents = [
              ['enter', element, context],
              ['enter', events[open][1], context],
              ['exit', events[open][1], context],
              ['enter', text, context],
            ];

            // Resolve anything nested between the delimiters, so that
            // `=a **b** c=` keeps its emphasis.
            const insideSpan = context.parser.constructs.insideSpan.null;

            if (insideSpan) {
              splice(
                nextEvents,
                nextEvents.length,
                0,
                resolveAll(insideSpan, events.slice(open + 1, index), context),
              );
            }

            splice(nextEvents, nextEvents.length, 0, [
              ['exit', text, context],
              ['enter', events[index][1], context],
              ['exit', events[index][1], context],
              ['exit', element, context],
            ]);

            splice(events, open - 1, index - open + 3, nextEvents);

            index = open + nextEvents.length - 2;
            break;
          }
        }
      }
    }

    // Any run that never found a partner is literal text.
    index = -1;

    while (++index < events.length) {
      if (events[index][1].type === temporary) {
        events[index][1].type = types.data;
      }
    }

    return events;
  }

  /** @type {import('micromark-util-types').Tokenizer} */
  function tokenizeAttention(effects, ok, nok) {
    const previous = this.previous;
    const events = this.events;
    let size = 0;

    return start;

    function start(codeIn) {
      // Already inside a run of this marker: let the first one own it.
      if (
        previous === code &&
        events[events.length - 1][1].type !== types.characterEscape
      ) {
        return nok(codeIn);
      }

      effects.enter(temporary);
      return more(codeIn);
    }

    function more(codeIn) {
      const before = classifyCharacter(previous);

      if (codeIn === code) {
        if (size + 1 > maxSize) return nok(codeIn);
        effects.consume(codeIn);
        size++;
        return more;
      }

      // Too short a run to mean anything: leave it as text. This is what
      // keeps `key=value` prose out of a `==mark==` document.
      if (size < minSize) return nok(codeIn);

      const token = effects.exit(temporary);
      const after = classifyCharacter(codeIn);

      // Flanking rules, as for emphasis: a run may open only when it is not
      // followed by whitespace, and close only when not preceded by it. This
      // is what keeps `3 = 3 = 3` and `a ~ b` as plain text.
      token._open =
        !after || (after === constants.attentionSideAfter && Boolean(before));
      token._close =
        !before || (before === constants.attentionSideAfter && Boolean(after));

      return ok(codeIn);
    }
  }
}

// Re-exported so the registry can spell markers as characters, not code points.
export { codes };
