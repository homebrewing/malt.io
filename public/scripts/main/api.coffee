###
Malt.io API client
###
class window.Maltio
    @auth: null
    @version: 1
    @clientId: '5262cc03ba318e4ff21d7d6d'
    @debug: true
    @endpoint: ENV
    @config:
        prod:
            host: 'https://api.malt.io'
            redirect: 'http://www.malt.io/auth/callback'
        beta:
            host: 'https://api.malt.io'
            redirect: 'http://beta.malt.io/auth/callback'
        dev:
            host: 'http://localhost:2337'
            redirect: 'http://localhost:9000/auth/callback'

    @host: ->
        @config[@endpoint].host

    @redirect: ->
        @config[@endpoint].redirect

    @authorizeUrl: ->
        scopes = ['user', 'user:delete', 'recipe', 'recipe:delete', 'private']
        "#{@host()}/account/authorize?response_type=code&redirect_uri=#{@redirect()}&scope=#{scopes.join ','}&client_id=#{@clientId}&type=token"

    @accessTokenUrl: ->
        "#{@host()}/account/access_token"

    @request: (method, path, data, done) ->
        url = "#{@host()}/v1/#{path}"

        # Print request info to console if debugging is enabled
        if @debug
            console?.debug? "#{method} #{url}"
            if Object.keys(data).length then console?.debug? data

        # Setup auth header if needed
        headers = {}
        if @auth and path.substr(0, 6) isnt 'public'
            headers.Authorization = "bearer #{@auth}"

        options =
            type: method
            headers: headers
            dataType: 'json'
            url: url
            data: data
            success: done

        if method.toLowerCase() isnt 'get'
            # Send JSON
            options.data = JSON.stringify data
            options.contentType = 'application/json; charset=UTF-8'

        $.ajax options

    # Shortcuts for HTTP GET/POST/PUT/DELETE
    @get: (path, data, done) ->
        @request 'get', path, data, done

    @post: (path, data, done) ->
        @request 'post', path, data, done

    @put: (path, data, done) ->
        @request 'put', path, data, done

    @del: (path, data, done) ->
        @request 'delete', path, data, done
