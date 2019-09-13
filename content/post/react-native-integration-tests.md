---
title: "3 Steps to Writing Awesome React Native Tests"
slug: react-native-integration-tests
date: 2019-08-30T14:12:35.284Z
---

{{< tweet 807626710350839808 >}}

Whatever your approach to tests is - testing pyramid[^1] or testing trophy[^2] - you know
that you need to write integration tests. In this post I'm going to show how to setup
integration tests for React Native project.

<!--more-->

### Step 1 - install react-component-driver

This library simplifies your test by offering functions for commonly used functionality.
It uses react-test-renderer which allows to run your app code on Node.js. It is possible
to write tests using just react-test-renderer, however creating a driver for each screen
makes your test code more readable and requires less changes when product changes.

### Step 2 - configure jest

React Native components sometimes require platform-specific counterparts to function
correctly. Since our tests run in Node, instantiating those is tricky. The solution is to
replace these components in tests with ones that feature just enough behavior to allow
testing. For our example test we'll need to mock TouchableOpacity and Switch components.
We need to tell jest where to look for mocks setup file. This way mocked versions of
components are available in each test suite.

```JSON
// package.json
"jest": {
  "setupFiles": [
    "./jest-setup.js"
  ]
}
```

This setup file just sets up mocks for the components that are used in example app. It's a
good place to also setup async-storage mocking and other mocks you might commonly need for
tests.

```JavaScript
// jest-setup.js
const mockAsBasicComponent = (name) => {
  const React = require('react');
  const RealComponent = require.requireActual(name);
  const BasicComponent = {[name]: props => React.createElement(name, props)}[name];
  BasicComponent.propTypes = RealComponent.propTypes;
  return BasicComponent;
}

jest.mock('TouchableOpacity', () => mockAsBasicComponent('TouchableOpacity'));
jest.mock('Switch', () => mockAsBasicComponent('Switch'));
```

### Step 3 - write a test case

Let’s create a simple app screen for us to test.

```JavaScript
// App.js
import React from 'react';
import {Button, SafeAreaView, Switch, Text, View} from 'react-native';

const server = 'https://enzzig7fs9o5j.x.pipedream.net';

function CheckBox({value, label, onValueChange, testID}) {
  return (
    <View style={{flexDirection: 'row', justifyContent: 'space-between', padding: 10}}>
      <Text>{label}</Text>
      <Switch onValueChange={onValueChange} value={value} testID={testID}/>
    </View>
  );
}

export default function Example() {
  const [awesome, setAwesome] = React.useState(false);
  const [stunning, setStunning] = React.useState(false);
  const sendData = () => {
    fetch(server, {method: 'PUT', body: JSON.stringify({awesome, stunning})});
  };
  return (
    <SafeAreaView>
      <Text style={{fontSize: 20, fontWeight: 'bold', alignSelf: 'center'}}>React Native is:</Text>
      <CheckBox value={awesome} label="Awesome" onValueChange={setAwesome} testID="awesome"/>
      <CheckBox value={stunning} label="Stunning" onValueChange={setStunning} testID="stunning"/>
      <Button title="Send" onPress={sendData} testID="submit"/>
    </SafeAreaView>
  );
}
```

Now we’ll instantiate this component in our test using a component driver and write a test
to toggle a checkbox and to press a submit button.

```JavaScript
// __tests__/App-test.js
import 'react-native';
import {act} from 'react-test-renderer';
import {componentDriver} from 'react-component-driver';
import Example from '../App';

const getExampleDriver = () => componentDriver(Example, {
  toggleAwesome(value) {
    this.getByID('awesome').props.onValueChange(value);
    return this;
  },
  pressSend() {
    this.getByID('submit').props.onPress();
    return this;
  },
  isAwesome() {
    return this.getByID('awesome').props.value;
  },
});

test('using Example screen driver', async () => {
  fetch = jest.fn();
  const driver = getExampleDriver()
    .toggleAwesome(true)
    .pressSend();
  expect(driver.isAwesome()).toBeTruthy();
  expect(fetch).toHaveBeenCalledTimes(1);
});
```

Notice how using the driver allows us to focus on what actions are being performed, while
the details of how they are performed are delegated to the driver.

Finally, two more tips for writing better integration tests:

 * Use [mocking sparingly]. Our team at Wix Mobile App had some test cases where Redux
   selectors were being mocked - when the state shape changed, tests for that screen were
   still “green”, while the app was crashing when opened on device. It’s good to use test
   doubles for network, disk, etc. Avoid using mocks for code that’s a part of your
   project.

 * Avoid component snapshot testing. Comparing snapshots can be useful when writing unit
   tests, but in integration tests they will be a source of flakiness. Simply check for
   presence/absence of components with specific testIDs and whether correct API calls were
   made. This will give you the freedom to refactor with confidence.

The source code for this article is available
[here](https://github.com/overengineered/blog/tree/samples/DriverTesting).

Thanks to Morad Stern, Roman Kolgushev, Guy Manzuruola, and Ran Greenberg for reviews and suggestions.

[^1]: [Good arguments][p1] for [testing pyramid] approach
[^2]: [Good arguments][t1] for [testing trophy] approach

[testing pyramid]: https://martinfowler.com/articles/practical-test-pyramid.html
[testing trophy]: https://kentcdodds.com/blog/write-tests
[p1]: https://jamescrisp.org/2011/05/30/automated-testing-and-the-test-pyramid/
[t1]: https://blog.usejournal.com/lean-testing-or-why-unit-tests-are-worse-than-you-think-b6500139a009
[mocking sparingly]: https://medium.com/javascript-scene/mocking-is-a-code-smell-944a70c90a6a
