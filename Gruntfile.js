module.exports = function (grunt) {

  // Add the grunt-mocha-test tasks.
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.initConfig({
    // Configure a mochaTest task
    mochaTest: {
      test: {
        options: {
          recursive: true,
          sort: true,
          bail: false,
          reporter: 'spec',
          captureFile: 'results.txt', 	// Optionally capture the reporter output to a file
          quiet: false, 								// Optionally suppress output to standard out (defaults to false)
          clearRequireCache: false 			// Optionally clear the require cache before running tests (defaults to false)
        },
//        src: ['spec/**/tinyg-*.js']
        src: ['tests/000-*.js', 'tests/005-*/*.js']
      }
    }
  });

//  grunt.initConfig({
//    // Configure a mochaTest task
//    mochaTest: {
//      test: {
//        options: {
//          reporter: 'spec',
//          captureFile: 'results.txt', // Optionally capture the reporter output to a file
//          quiet: false, // Optionally suppress output to standard out (defaults to false)
//          clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
//        },
//        src: ['spec/**/*.js']
//      }
//    }
//  });
//
//
//
//
//
//  grunt.registerTask('v8', 'v8');
  grunt.registerTask('default', 'mochaTest');
}
