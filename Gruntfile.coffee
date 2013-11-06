fs = require 'fs'
url = require 'url'

# Connect middleware to handle HTML5 pushState routing that redirects
# requests for files which do not exist to index.html
urlRewrite = (rootDir, indexFile) ->
    indexFile = indexFile or "index.html"
    
    (req, res, next) ->
        path = url.parse(req.url).pathname
        fs.readFile "./" + rootDir + path, (err, buf) ->
            return next()  unless err
            fs.readFile "./" + rootDir + "/" + indexFile, (error, buffer) ->
                return next(error)  if error
                resp =
                    headers:
                        "Content-Type": "text/html"
                        "Content-Length": buffer.length
                    body: buffer

                res.writeHead 200, resp.headers
                res.end resp.body

module.exports = (grunt) ->
    grunt.initConfig
        pkg: grunt.file.readJSON 'package.json'
        jade:
            compile:
                options:
                    data:
                        ts: Date.now()
                        env: process.env.MALTIO_ENV or 'prod'
                files:
                    'www/index.html': ['public/index.jade']
        stylus:
            compile:
                files:
                    'public/styles/main.css': ['public/styles/main.styl']
        cssmin:
            combine:
                options:
                    banner: '/* Malt.io Combined Minified Style - http://www.malt.io/ */'
                    keepSpecialComments: 0
                    report: 'min'
                files:
                    'www/styles/combined.min.css': [
                        'public/styles/bootstrap.min.css',
                        'public/styles/main.css'
                    ]
        coffee:
            compile:
                options:
                    bare: true
                files:
                    'public/scripts/main.js': [
                        'public/scripts/main/utils.coffee',
                        'public/scripts/main/maps.coffee',
                        'public/scripts/main/bindings.coffee',
                        'public/scripts/main/api.coffee',
                        'public/scripts/main/models/fermentable.coffee',
                        'public/scripts/main/models/spice.coffee',
                        'public/scripts/main/models/yeast.coffee',
                        'public/scripts/main/models/recipe.coffee',
                        'public/scripts/main/user-list.coffee',
                        'public/scripts/main/user-detail.coffee',
                        'public/scripts/main/recipe-list.coffee',
                        'public/scripts/main/recipe-detail.coffee',
                        'public/scripts/main/app.coffee'
                    ]
        uglify:
            combine:
                options:
                    compress: true
                    report: 'min'
                files:
                    'public/scripts/main.min.js': [
                        'public/scripts/main.js'
                    ]
        concat:
            scripts:
                options:
                    separator: ';'
                    stripBanners: true
                    banner: '/* Malt.io Combined Minified Scripts - http://www.malt.io/ */'
                files:
                    'www/scripts/combined.min.js': [
                        'public/scripts/jquery-2.0.3.min.js',
                        'public/scripts/bootstrap.min.js',
                        'public/scripts/knockout-3.0.0.min.js',
                        'public/scripts/davis.min.js',
                        'public/scripts/moment.min.js',
                        'public/scripts/brauhaus.min.js',
                        'public/scripts/brauhaus-beerxml.min.js',
                        'public/scripts/FileSaver.min.js',
                        'public/scripts/main.min.js',
                    ]
        copy:
            main:
                files: [
                    {expand:true, cwd: 'public/images/', src: '**', dest: 'www/images/'}
                ]
        connect:
            server:
                options:
                    port: 9000
                    base: 'www'
                    middleware: (connect, options) ->
                        [
                            urlRewrite('www', 'index.html'),
                            connect.static(options.base)
                        ]
        watch:
            templates:
                files: ['public/*.jade', 'public/_pages/*.jade']
                tasks: ['jade']
            styles:
                files: ['public/styles/*']
                tasks: ['styles']
            scripts:
                files: ['public/scripts/main/*']
                tasks: ['scripts']

    grunt.loadNpmTasks 'grunt-contrib-jade'
    grunt.loadNpmTasks 'grunt-contrib-stylus'
    grunt.loadNpmTasks 'grunt-contrib-cssmin'
    grunt.loadNpmTasks 'grunt-contrib-coffee'
    grunt.loadNpmTasks 'grunt-contrib-concat'
    grunt.loadNpmTasks 'grunt-contrib-uglify'
    grunt.loadNpmTasks 'grunt-contrib-copy'
    grunt.loadNpmTasks 'grunt-contrib-connect'
    grunt.loadNpmTasks 'grunt-contrib-watch'

    grunt.registerTask 'styles', ['stylus', 'cssmin']
    grunt.registerTask 'scripts', ['coffee', 'uglify', 'concat']
    grunt.registerTask 'templates', ['jade']
    grunt.registerTask 'compile', ['templates', 'styles', 'scripts', 'copy']
    grunt.registerTask 'server', ['connect', 'watch']
    grunt.registerTask 'default', ['compile', 'server']
