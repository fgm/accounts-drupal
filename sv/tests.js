import {
  testCorrectConfiguration,
  testIncorrectConfiguration,
  testWhoamiHappy,
  testWhoamiSad,
} from './serverTests';

if (!Meteor.isPackageTest) {
  throw new Error('This code should only run in package test mode.');
}


describe('Legacy configuration-related tests ported from Tinytest', function () {
  it('should accept correct configuration', testCorrectConfiguration);
  it('should reject incorrect configuration', testIncorrectConfiguration);
});

describe('Server tests', function () {
  it('should return expected whoami values in happy cases', testWhoamiHappy);
  it('should return expected whoami values in sad cases', testWhoamiSad);
});
