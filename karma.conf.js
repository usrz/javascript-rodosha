'use strict';

module.exports = function(config) {

  config.set({
    /* Base tests definition */
    basePath: '.',
    frameworks: ['esquire', 'mocha', 'chai'],
    port: 9876,
    autoWatch: true,
    singleRun: false,

    /* These need to be in order */
    files: [
      'src/**/*.js',
      'test/messages.test.js',
      'test/rodosha.test.js',
      'test/types.test.js',
    ],

    /* Pretty */
    // logLevel: config.LOG_DEBUG,
    reporters: ['verbose'],
    colors: true,

    /* Our browsers */
    browsers: ['PhantomJS', 'Chrome', 'Firefox', 'Safari'],
  });
};
