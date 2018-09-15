const utils = require('./utils');

test('cleanTag', () => {
  const tag = 'greenDay';
  expect(utils.cleanTag(tag)).toEqual('green_day');
});