---
title: "Asserting on module imports with Jest"
slug: testing-imports
date: 2019-02-28T16:12:35.284Z
aliases:
    - /blog/testing-imports/
---

I work on React Native app and it's important to do as little as possible
at app start to reduce the time user has to wait before he can interact
with the app. One of the things that helped to reduce wait time was
switching from importing JavaScript modules at the top of the file to
requiring modules in the functions that actully use them. But the
challenge now is to prevent unwanted imports from appearing again.

<!--more-->

My immediate reaction was "Let's use tests for that". While the goal is
simple, finding a solution was not trivial. I tried using Jest machinery
on the require function, but could not find an approach that would allow
to inspect which modules are loaded.

```JavaScript
test('initialization is performant', () => {
  const spy = jest.spyOn(require); // require is undefined :/
  require('../');
  expect(spy).toHaveBeenCalledTimes(4);
});
```

Next I asked a question on StackOverflow, but did not get an answer. I did
get a comment pointing to [require-in-the-middle](https://github.com/elastic/require-in-the-middle)
package, which seemed promising. However I couldn't get it to work in Jest.
Apparently the magic that Jest does with `require` clashes with magic that
`require-in-the-middle` performs resulting in test case that depending on
Jest version crashes with stack overflow, never completes or just provides
no info about loaded modules.

```JavaScript
test('initialization is performant', () => {
  const hook = require('require-in-the-middle');
  const log = [];
  hook((path) => log.push(path));
  require('../index.js');
  expect(log).toEqual([]);
  // Does not finish on Jest 24.1.0
});
```

Now was the time to dig into undocumented features of Jest. There's a
configuration option `moduleLoader` that seems like a good fit for this
purpose. A quick test shows that we can indeed observe modules getting
loaded.

```JSON
"jest": {
  "preset": "react-native",
  "moduleLoader": "./inspectableModuleLoader.js"
}
```

```JavaScript
const DefaultLoader = require('jest-runtime');
class InspectableModuleLoader extends DefaultLoader {
  requireModule(from, moduleName, options) {
    console.log(moduleName);
    return DefaultLoader.prototype.requireModule.call(
      this, from, moduleName, options);
  }
}
module.exports = InspectableModuleLoader;
```

A stream of module names appears in console proving that it is a viable
way to achieve our goal. Now we have a challenge to assert on the data that
passes through `InspectableModuleLoader` in our test case. I'm not sure how
and why, but module loader and test runners don't share global objects.
However we can provide arguments to module loader by importing special paths
and module loader can return data to test case through return value of
`requireModule` function.

```JavaScript
const DefaultLoader = require('jest-runtime');
const path = require('path');

function modulePath(from, moduleName) {
  return typeof moduleName !== 'string'
    ? moduleName
    : moduleName.startsWith('.')
    ? path.relative(
        '.',
        path.join(path.dirname(from), moduleName))
    : moduleName;
}

function createTracker() {
  const imports = {};
  return {
    addImport(from, moduleName) {
      const basePath = path.relative('.', from);
      // Collect only direct imports
      if (!basePath.startsWith('node_modules') &&
          !moduleName.startsWith('@babel/runtime')) {
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
    if (typeof moduleName === 'string') {
      if (moduleName.endsWith('inspect(end)')) {
        const result = this.tracker.getImports();
        this.tracker = undefined;
        return result;
      }

      if (this.tracker) {
        this.tracker.addImport(from, moduleName, options);
      }

      if (moduleName.endsWith('inspect(begin)')) {
        this.tracker = createTracker();
        return null;
      }
    }

    return DefaultLoader.prototype.requireModule.call(
      this, from, moduleName, options);
  }
}

module.exports = InspectableModuleLoader;
```

```JavaScript
test('initialization is performant', () => {
  require('inspect(begin)');
  require('../index.js')
  expect(require('inspect(end)')).toEqual([]);
});
```

The result is failing test case.
> `Cannot find module 'inspect(begin)' from 'imports.js'`.

That's a bummer: module finder runs first and if module cannot be found,
module loader is not even called. I chose an ugly solution: actually adding
files `./inspect(begin)` and `./inspect(end)` to the project. This allows to
sidestep the need to deal with more undocumented APIs to customize Jest
module finder.

Now the test

```JavaScript
test('initialization is performant', () => {
  require('../inspect(begin)');
  require('../index.js')
  expect(require('../inspect(end)')).toEqual([]);
});
```

gives us

> \- Expected  
> \+ Received
>
> \- Array []  
> \+ Array [  
> \+ &nbsp; "App",  
> \+ &nbsp; "app.json",  
> \+ &nbsp; "index.js",  
> \+ &nbsp; "react",  
> \+ &nbsp; "react-native",  
> \+ ]

Let's change how we import App component.

```JavaScript
AppRegistry.registerComponent(
  appName, () => require('./App').default);
```

And we have a passing test.

```JavaScript
test('initialization is performant', () => {
  require('../inspect(begin)');
  require('../index.js')
  expect(require('../inspect(end)')).toEqual([
    'app.json', 'index.js', 'react-native'
  ]);
});
```

Getting rid of import for `App.js` and `react` gives no performance benefits
in this [sample app](https://github.com/overengineered/blog/tree/samples/ImportsProject).
In larger apps that register multiple components this can give significant
performance boost. The test case looks a bit ugly and I would like to find a
more elegant way to express intent here, but for now I have a solution that
gets the job done.
