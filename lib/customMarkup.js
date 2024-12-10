import { remarkMark } from './remarkMark.js';

/**
 * Combines selected custom plugins into a unified plugin chain.
 * @param {Array} plugins - An array of functions representing custom plugins.
 * @returns {Function[]} - The chain of plugins to include in the unified pipeline.
 */
export function customMarkup(plugins = []) {
  // Add desired plugins here
  const availablePlugins = {
    remarkMark,
    // Add more custom plugins here as they are created
  };

  return plugins.map((pluginName) => {
    const plugin = availablePlugins[pluginName];
    if (!plugin) {
      throw new Error(`Unknown plugin: ${pluginName}`);
    }
    return plugin;
  });
}
