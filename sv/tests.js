import { testCorrectConfiguration, testIncorrectConfiguration } from './serverTests';

if (!Meteor.isPackageTest) {
  throw new Error('This code should only run in package test mode.');
}


describe('Legacy configuration-related tests ported from Tinytest', function () {
  it('should accept correct configuration', testCorrectConfiguration);
  it('should reject incorrect configuration', testIncorrectConfiguration);
});
