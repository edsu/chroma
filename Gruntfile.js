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
                        cwd: 'static/',
                        src: ['**/*.*'],
                        dest: 'dist/static/'
                    },
                    {
                        expand: true,
                        cwd: 'bower_components/repositoryservicestheme/dist/',
                        src: '**',
                        dest: 'dist/static/'
                    },
                    {
                        src: ['templates/*'],
                        dest: 'dist/'
                    },
                ]
            }
        },
        hashres: {
            options: {
                encoding: 'utf8',
                fileNameFormat: '${hash}~${name}.${ext}',
                renameFiles: true
            },
            prod: {
                options: {
                },
                // Files to hash
                src: ['dist/static/**/*.*', '!dist/static/**/*~*.*', '!dist/static/robots.txt', '!dist/static/favicon.ico'],
                // File that refers to above files and needs to be updated with the hashed name
                dest: ['dist/templates/*.html'],
            }
        }
    });

    require('load-grunt-tasks')(grunt, {scope: 'devDependencies'});

    // Test task.
    grunt.registerTask('test', []);

    // Images distribution task
    grunt.registerTask('dist-theme', ['copy']);

    // Full distribution task.
    grunt.registerTask('dist', ['clean', 'dist-theme', 'hashres']);

    // Default task.
    grunt.registerTask('default', ['shell:goinstall', 'test', 'dist']);

};
