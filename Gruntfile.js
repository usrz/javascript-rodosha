module.exports = function(grunt) {

  /* Chai for simple mocha */
  var chai = require('chai');
  chai.config.includeStack = true;
  global.expect = chai.expect;

  /* Grunt initialization */
  grunt.initConfig({

    /* Unit testing */
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        runnerPort: 9999,
        singleRun: true,
        browsers: ['PhantomJS', 'Chrome', 'Firefox', 'Safari'],
        logLevel: 'ERROR'
      }
    },

    /* Simple mocha */
    simplemocha: {
      'options': { slow: 500 },
      'default': {
        src: [ 'index.js',
               'test/*.js' ]
      }
    },

    /* Concatenate task */
    concat: {
      build: {
        src: 'src/**/*.js',
        dest: 'slaves.js',
        options: {
          banner: '(function() {\n',
          footer: '\n})();\n',
          separator: ';\n'
        }
      }
    },

    /* Uglify task */
    uglify: {
      build: {
        src: 'src/**/*.js',
        dest: 'slaves.min.js',
        options: {
          wrap: true
        }
      }
    },

    /* Documentation task */
    'jsdoc-ng' : {
      'dist' : {
        src: ['src/*.js', 'README.md' ],
        dest: 'docs',
        template : 'jsdoc-ng',
        options: {
          "plugins": ["plugins/markdown"],
          "templates": {
            "cleverLinks":    true,
            "monospaceLinks": true,
            "windowTitle": "Slaves API",
            "minify": false
          },
          "markdown": {
            "parser": "gfm",
            "hardwrap": true
          }
        }
      }
    },

    /* Publish GirHub Pages */
    'gh-pages': {
      src: '**/*',
      options: {
        base: 'docs'
      }
    }

  });

  /* Load our plugins */
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-jsdoc-ng');
  grunt.loadNpmTasks('grunt-gh-pages');

  /* Default tasks */
  grunt.registerTask('default', ['karma', 'concat', 'uglify']);
  grunt.registerTask('docs', ['jsdoc-ng', 'gh-pages']);

};
