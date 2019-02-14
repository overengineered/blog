test('initialization is performant', () => {
  require('../inspect(begin)');
  require('../index.js')
  expect(require('../inspect(end)')).toEqual(['app.json', 'index.js', 'react-native']);
});
