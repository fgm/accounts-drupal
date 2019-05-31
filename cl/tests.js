if (!Meteor.isPackageTest) {
  throw new Error('This code should only run in package test mode.');
}

describe('fake mocha client suite', function () {
  it('fake mocha client test', function () {
    // This code will be executed by the test driver when the app is started
    // in the correct mode
  });
});

