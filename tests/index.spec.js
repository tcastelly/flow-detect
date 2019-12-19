const { dirname, join } = require('path');

describe('GIVEN flow-detect script', () => {
  let flowDetect;
  const mockExit = jest.fn();
  const mockErrorLog = jest.fn();

  beforeAll(() => {
    jest.spyOn(process, 'exit').mockImplementation(mockExit);
    jest.spyOn(console, 'error').mockImplementation(mockErrorLog);

    flowDetect = require('../src/flowDetect'); // eslint-disable-line global-require
  });

  describe('WHEN call the script on `tests` folders', () => {
    beforeAll(async (done) => {
      global.process.argv[2] = 'tests';
      await flowDetect();
      done();
    });

    it('THEN the script should exit with an error', () => {
      expect(mockExit.mock.calls[0][0]).toBe(1);
    });

    it('AND files  without flow annotation should be in systemout', () => {
      expect(mockErrorLog.mock.calls[0][0][0]).toBe(__filename);
      expect(mockErrorLog.mock.calls[0][0][1]).toBe(join(dirname(__filename), 'noFlow.js'));
    });
  });
});
