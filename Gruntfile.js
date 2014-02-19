module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bower: grunt.file.readJSON('bower.json'),
        banner: '/**\n' +
                '* <%= bower.name %>.js v<%= bower.version %> \n' +
                '* <%= grunt.template.today("yyyy/mm/dd") %> \n' +
                '*/\n',
        shell: {
              goinstall: {
                  options: {
                      failOnError: true,
                      stdout: true,
                      execOptions: {
                        cwd: '.'
                      }
                  },
                  command: 'go build -v .'
              }
        },
        clean: {
            dist: ['dist', 'build']
        },
        copy: {
            images: {
                files: [
                    {
                        expand: true,
                        cwd: 'bower_components/repositoryservicestheme/dist/',
                        src: '**',
                        dest: 'static/<%= bower.version %>'
                    }
                ]
            }
        }
    });

    require('load-grunt-tasks')(grunt, {scope: 'devDependencies'});

    // Test task.
    grunt.registerTask('test', []);

    // Images distribution task
    grunt.registerTask('dist-theme', ['copy']);

    // Full distribution task.
    grunt.registerTask('dist', ['clean', 'dist-theme']);

    // Default task.
    grunt.registerTask('default', ['shell:goinstall', 'test', 'dist']);

};
