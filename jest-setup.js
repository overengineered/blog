const mockAsBasicComponent = (name) => {
  const React = require('react');
  const RealComponent = require.requireActual(name);
  const BasicComponent = {[name]: props => React.createElement(name, props)}[name];
  BasicComponent.propTypes = RealComponent.propTypes;
  return BasicComponent;
}

jest.mock('TouchableOpacity', () => mockAsBasicComponent('TouchableOpacity'));
jest.mock('Switch', () => mockAsBasicComponent('Switch'));
