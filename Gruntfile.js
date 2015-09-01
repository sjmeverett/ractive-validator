

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pure_cjs: {
      dev: {
        files: {
          'dist/ractive-validator.js': 'src/RactiveValidator.js'
        },
        options: {
          exports: 'RactiveValidator',
          external: {
            jquery: {global: 'jQuery'},
            moment: {global: 'moment'}
          },
          transform: [require('babelify'), require('bulkify')]
        }
      }
    },

    uglify: {
      release: {
        files: [{
          expand: true,
          flatten: true,
          src: ['dist/*.js', '!dist/*.min.js'],
          dest: 'dist/',
          ext: '.min.js',
          extDot: 'last'
        }]
      }
    },

    notify_hooks: {
      options: {
        enabled: true,
        success: true
      }
    },

    clean: {
      release: [
        'dist'
      ]
    }
  });

  grunt.task.run('notify_hooks');

  grunt.registerTask('dev', [
    'pure_cjs:dev',
  ]);

  grunt.registerTask('release', [
    'dev',
    'uglify:release'
  ]);

  grunt.registerTask('default', ['dev']);
};
