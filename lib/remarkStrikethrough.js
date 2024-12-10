import { visit } from 'unist-util-visit';

export function remarkStrikethrough() {
  return function transformer(tree) {
    visit(tree, 'text', (node, index, parent) => {
      const regex = /~(.+?)~/g;
      const newChildren = [];
      let lastIndex = 0;

      let match;
      while ((match = regex.exec(node.value)) !== null) {
        const [fullMatch, styledText] = match;

        // Add text before the match as a text node
        if (match.index > lastIndex) {
          newChildren.push({
            type: 'text',
            value: node.value.slice(lastIndex, match.index),
          });
        }

        // Add the styled text as a custom inline HTML node
        newChildren.push({
          type: 'html',
          value: `<s>${styledText}</s>`,
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
