const DefaultLoader = require('jest-runtime');
const path = require('path');

function modulePath(from, moduleName) {
  return typeof moduleName !== 'string'
    ? moduleName
    : moduleName.startsWith('.')
    ? path.relative('.', path.join(path.dirname(from), moduleName))
    : moduleName;
}

function createTracker() {
  const imports = {};
  return {
    addImport(from, moduleName) {
      const basePath = path.relative('.', from);
      // Collect only modules that are directly imported from project sources
      if (!basePath.startsWith('node_modules') && !moduleName.startsWith('@babel/runtime')) {
        imports[modulePath(from, moduleName)] = from;
      }
    },
    getImports() {
      return Object.keys(imports).sort();
    }
  };
}

class InspectableModuleLoader extends DefaultLoader {
  requireModule(from, moduleName, options) {
    if (typeof moduleName === 'string' && moduleName.endsWith('inspect(end)')) {
      const result = this.tracker.getImports();
      this.tracker = undefined;
      return result;
    }

    if (this.tracker) {
      this.tracker.addImport(from, moduleName, options);
    }

    if (typeof moduleName === 'string' && moduleName.endsWith('inspect(begin)')) {
      this.tracker = createTracker();
      return null;
    }

    return DefaultLoader.prototype.requireModule.call(this, from, moduleName, options);
  }
}

module.exports = InspectableModuleLoader;
