import { remarkMark } from './remarkMark.js';
import { remarkDfn } from './remarkDfn.js';

/**
 * Combines selected custom plugins into a unified plugin chain.
 * @param {Array} plugins - An array of strings representing custom plugins.
 * @returns {Function[]} - The chain of plugins to include in the unified pipeline.
 */
export function customMarkup(plugins = []) {
  const availablePlugins = {
    remarkMark,
    remarkDfn,
    // Add more custom plugins here as needed
  };

  return plugins.map((pluginName) => {
    const plugin = availablePlugins[pluginName];
    if (!plugin) {
      throw new Error(`Unknown plugin: ${pluginName}`);
    }
    return plugin;
  });
}
