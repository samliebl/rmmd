import { visit } from 'unist-util-visit';

export function remarkMark() {
  return function transformer(tree) {
    visit(tree, 'text', (node, index, parent) => {
      const regex = /=(.+?)=/g;
      const newChildren = [];
      let lastIndex = 0;

      let match;
      while ((match = regex.exec(node.value)) !== null) {
        const [fullMatch, markedText] = match;

        // Add text before the match as a text node
        if (match.index > lastIndex) {
          newChildren.push({
            type: 'text',
            value: node.value.slice(lastIndex, match.index),
          });
        }

        // Add the marked text as a custom inline HTML node
        newChildren.push({
          type: 'html',
          value: `<mark>${markedText}</mark>`,
        });

        lastIndex = regex.lastIndex;
      }

      // Add remaining text as a text node
      if (lastIndex < node.value.length) {
        newChildren.push({
          type: 'text',
          value: node.value.slice(lastIndex),
        });
      }

      // Replace the text node with the new nodes in the parent's children array
      if (newChildren.length > 0 && parent) {
        parent.children.splice(index, 1, ...newChildren);
      }
    });
  };
}
