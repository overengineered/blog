import 'react-native';
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
