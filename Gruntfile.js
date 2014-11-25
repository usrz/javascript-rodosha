module.exports = function(grunt) {

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
    'esquire-mocha': {
      'options': { slow: 500 },
      'default': {
        src: [
          'index.js',
          'test/messages.test.js',
          'test/rodosha.test.js',
          'test/node.test.js' ]
      }
    },

    /* Concatenate task */
    concat: {
      build: {
        src: 'src/**/*.js',
        dest: 'rodosha.js',
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
        dest: 'rodosha.min.js',
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
  grunt.loadNpmTasks('grunt-esquire-mocha');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-jsdoc-ng');
  grunt.loadNpmTasks('grunt-gh-pages');

  /* Default tasks */
  grunt.registerTask('default', ['test', 'concat', 'uglify']);
  grunt.registerTask('test', ['karma', 'simplemocha']);
  grunt.registerTask('docs', ['jsdoc-ng', 'gh-pages']);

};
