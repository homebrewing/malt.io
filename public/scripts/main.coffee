###
Malt.io API client
###
class Maltio
    @auth: null
    @version: 1
    @clientId: '5262cc03ba318e4ff21d7d6d'
    @host: 'https://api.malt.io'
    # Uncomment the line below for local testing
    #@host: 'http://localhost:2337'
    @redirect: 'http://localhost:9000/auth/callback'
    @debug: true

    @authorizeUrl: ->
        scopes = ['user', 'user:delete', 'recipe', 'recipe:delete', 'private']
        "#{@host}/account/authorize?response_type=code&redirect_uri=#{@redirect}&scope=#{scopes.join ','}&client_id=#{@clientId}&type=token"

    @accessTokenUrl: ->
        "#{@host}/account/access_token"

    @request: (method, path, data, done) ->
        url = "#{@host}/v1/#{path}"

        # Print request info to console if debugging is enabled
        if @debug
            console?.debug? "#{method} #{url}"
            if Object.keys(data).length then console?.debug? data

        # Setup auth header if needed
        headers = {}
        if @auth and path.substr(0, 6) isnt 'public'
            headers.Authorization = "bearer #{@auth}"

        $.ajax
            type: method
            headers: headers
            dataType: 'json'
            url: url
            data: data
            success: done

    # Shortcuts for HTTP GET/POST/PUT/DELETE
    @get: (path, data, done) ->
        @request 'get', path, data, done

    @post: (path, data, done) ->
        @request 'post', path, data, done

    @put: (path, data, done) ->
        @request 'put', path, data, done

    @del: (path, data, done) ->
        @request 'delete', path, data, done

# Utilities to draw maps
class Mapping
    @draw: (id, lat, lng) =>
        mapOptions =
          center: new google.maps.LatLng lat || 40.7142, lng || -74.0064
          zoom: 11
          mapTypeId: google.maps.MapTypeId.ROADMAP
          mapTypeControl: false
          streetViewControl: false

        map = new google.maps.Map document.getElementById(id), mapOptions

        google.maps.event.addListener map, 'center_changed', ->
            center = map.getCenter()

            #$('#lat').val center.lat()
            #$('#lng').val center.lng()

        map.setOptions
            styles: [
                {
                  "featureType": "water",
                  "stylers": [
                    { "visibility": "simplified" },
                    { "hue": "#ffc300" },
                    { "saturation": -83 },
                    { "lightness": -19 }
                  ]
                },{
                  "featureType": "landscape",
                  "stylers": [
                    { "visibility": "on" },
                    { "color": "#ffffff" }
                  ]
                },{
                  "featureType": "road",
                  "stylers": [
                    { "saturation": -83 },
                    { "visibility": "on" },
                    { "hue": "#ff9900" },
                    { "lightness": 18 }
                  ]
                },{
                  "featureType": "poi",
                  "stylers": [
                    { "visibility": "on" },
                    { "saturation": -50 }
                  ]
                },{
                  "featureType": "transit.line",
                  "stylers": [
                    { "visibility": "simplified" },
                    { "lightness": 21 },
                    { "saturation": -51 }
                  ]
                }
              ]

###
A generic paged view model that implements an update method
to fetch and show new data anytime the page is modified.
###
class PagedViewModel
    constructor: ->
        # Paging variables
        @perPage = ko.observable 25
        @page = ko.observable 0

        @page.extend notify: 'always'

        # Computed values for previous and next pages
        @prevPage = ko.computed =>
            page = Math.max(0, @page() - 1)
            if page then "-#{page}" else ''

        @nextPage = ko.computed =>
            "-#{@page() + 1}"

        # Call update on changes
        @perPage.subscribe (value) =>
            @update()

        @page.subscribe (value) =>
            @update()

    update: (done) ->
        # Do nothing. Subclasses must override this method!
        done?()

class UserListViewModel extends PagedViewModel
    constructor: ->
        super()
        @users = ko.observableArray()

    update: (done) ->
        offset = @perPage() * @page()
        Maltio.get 'public/users', {offset, limit: @perPage()}, (users) =>
            @users users
            done?()

class UserDetailViewModel
    constructor: ->
        @user = ko.observable()
        @recipes = ko.observableArray()
        @actions = ko.observableArray()

    load: (username, done) ->
        Maltio.get 'public/users', {names: username}, (users) =>
            @user users[0]

            Maltio.get 'public/recipes', {userIds: users[0].id, detail: true}, (recipes) =>
                @recipes recipes

            Maltio.get 'public/actions', {userIds: users[0].id}, (actions) =>
                @actions actions

            done?()

            Mapping.draw 'user-detail-map', users[0].location[0], users[0].location[1]

class RecipeListViewModel extends PagedViewModel
    constructor: ->
        super()
        @user = null
        @baseUrl = ko.observable '/recipes'
        @recipes = ko.observableArray()

    # Set a user via a username, unset by passing null
    setUser: (username, done) ->
        if username
            Maltio.get 'public/users', {names: username}, (users) =>
                @user = users[0]
                done?()
        else
            @user = null
            done?()

    update: (done) ->
        options =
            offset: @perPage() * @page()
            limit: @perPage()
            detail: true

        if @user
            options.userIds = @user.id

        Maltio.get 'public/recipes', options, (recipes) =>
            @recipes recipes
            done?()

class FermentableModel
    constructor: (recipe, apiFermentable) ->
        self = this

        @recipe = recipe

        for property in ['color', 'late', 'name', 'weight', 'yield']
            @[property] = ko.observable apiFermentable[property]
            @[property].subscribe ->
                self.recipe.calculate()

        for property in ['weight']
            do (property) ->
                self[property + 'Lb'] = ko.computed
                    read: ->
                        if isNaN self[property]() then undefined else
                            Brauhaus.kgToLbOz(self[property]()).lb

                    write: (value) ->
                        lbs = value + (self[property + 'Oz']() / 16.0)
                        kg = Brauhaus.lbToKg lbs
                        self[property] kg

                self[property + 'Oz'] = ko.computed
                    read: ->
                        if isNaN self[property]() then undefined else
                            Brauhaus.kgToLbOz(self[property]()).oz

                    write: (value) ->
                        lbs = self[property + 'Lb']() + (value / 16.0)
                        kg = Brauhaus.lbToKg lbs
                        self[property] kg

        @colorEbc = ko.computed
            read: ->
                if isNaN self.color() then undefined else
                    Brauhaus.srmToEbc self.color()

            write: (value) ->
                srm = if isNaN value then undefined else
                    Brauhaus.ebcToSrm value
                self.color srm

        @ppg = ko.computed
            read: ->
                if isNaN self.yield() then undefined else
                    new Brauhaus.Fermentable(self.toJSON()).ppg()

            write: ->
                0

    toJSON: ->
        color: @color()
        late: @late()
        name: @name()
        weight: @weight()
        yield: @yield()

class RecipeModel
    constructor: (apiRecipe) ->
        self = this

        for property in ['name', 'description', 'style', 'batchSize', 'boilSize']
            @[property] = ko.observable apiRecipe.data[property]
            @[property].subscribe ->
                self.calculate()

        for property in ['og', 'fg', 'ibu', 'abv']
            @[property] = ko.observable apiRecipe.data[property]

        for property in ['batchSize', 'boilSize']
            do (property) ->
                self[property + 'Gallons'] = ko.computed
                    read: ->
                        if isNaN self[property]() then undefined else
                            Brauhaus.litersToGallons self[property]()

                    write: (value) ->
                        liters = if isNaN value then undefined else
                            Brauhaus.gallonsToLiters parseFloat(value)

                        self[property] liters

        @fermentables = ko.observableArray (new FermentableModel(self, x) for x in apiRecipe.fermentables or [])
        @fermentables.subscribe ->
            self.calculate()

    toJSON: ->
        name: @name()
        description: @description()
        style: @style()
        batchSize: @batchSize()
        boilSize: @boilSize()
        fermentables: (x.toJSON() for x in @fermentables())

    addFermentable: (name, yieldAmt, srm) ->
        @fermentables.push new FermentableModel(this,
            name: name
            weight: 1.0
            yield: yieldAmt
            color: srm
        )

    calculate: ->
        temp = new Brauhaus.Recipe @toJSON()
        temp.calculate()

        @og temp.og
        @fg temp.fg
        @ibu temp.ibu
        @abv temp.abv

class RecipeDetailViewModel
    fermentableTemplates: [
        ['Malt extract', [
            ['Extra pale liquid extract', 80, 2],
            ['Extra light dry extract', 90, 2.5],
            ['Pale liquid extract', 76, 4],
            ['Maris Otter liquid extract', 78, 4.5]
        ]]
    ]

    constructor: ->
        @edit = ko.observable false
        @recipe = ko.observable()

    load: (username, slug, done) ->
        Maltio.get 'public/users', {names: username}, (users) =>
            Maltio.get 'public/recipes', {userIds: users[0].id, slugs: slug}, (recipes) =>
                @recipe new RecipeModel(recipes[0])
                @recipe().calculate()
                done?()

    toggleEdit: ->
        @edit not @edit()

class AppViewModel
    constructor: ->
        self = this

        @user = ko.observable()
        @page = ko.observable 'userList'
        @crumbs = ko.observableArray()
        @metric = ko.observable true

        @userList = new UserListViewModel()
        @userDetail = new UserDetailViewModel()
        @recipeList = new RecipeListViewModel()
        @recipeDetail = new RecipeDetailViewModel()

        # Set logged in user from saved session
        if localStorage['user.id']
            @user
                id: localStorage['user.id']
                name: localStorage['user.name']
                email: localStorage['user.email']
                image: localStorage['user.image']
                token: localStorage['user.token']

            Maltio.auth = localStorage['user.token']

        @user.subscribe (newUser) ->
            # Save this login session for subsequent page loads
            if newUser
                Maltio.auth = newUser.token
                localStorage['user.id'] = newUser.id
                localStorage['user.name'] = newUser.name
                localStorage['user.email'] = newUser.email
                localStorage['user.image'] = newUser.image
                localStorage['user.token'] = newUser.token
            else
                Maltio.auth = null
                delete localStorage['user.id']
                delete localStorage['user.name']
                delete localStorage['user.email']
                delete localStorage['user.image']
                delete localStorage['user.token']

        # Page routing via HTML5 History states
        router = Davis ->
            @get '/users/:username/recipes/:slug', (req) ->
                self.recipeDetail.load req.params.username, req.params.slug, ->
                    self.page 'recipeDetail'
                    self.crumbs [['home', '/'], [req.params.username, "/users/#{req.params.username}"], ['recipes', "/users/#{req.params.username}/recipes"], [self.recipeDetail.recipe().name, '']]

            @get '/users/:username/recipes-?:page?', (req) ->
                self.recipeList.baseUrl "/users/#{req.params.username}/recipes"
                self.recipeList.setUser req.params.username, ->
                    self.page 'recipeList'
                    self.crumbs [['home', '/'], [req.params.username, "/users/#{req.params.username}"], ['recipes', '']]
                    self.recipeList.page parseInt(req.params.page) or 0

            @get '/users/:username', (req) ->
                self.userDetail.load req.params.username, ->
                    self.page 'userDetail'
                    self.crumbs [['home', '/'], ['users', '/users'], [req.params.username, '']]

            @get '/users-?:page?', (req) ->
                self.page 'userList'
                self.crumbs [['home', '/'], ['users', '']]
                self.userList.page parseInt(req.params.page) or 0

            @get '/recipes-?:page?', (req) ->
                self.recipeList.baseUrl '/recipes'
                self.recipeList.setUser null, ->
                    self.page 'recipeList'
                    self.crumbs [['home', '/'], ['recipes', '']]
                    self.recipeList.page parseInt(req.params.page) or 0

            # Oauth Login Handling
            @get '/auth/callback', (req) ->
                # The user has registered/logged in and we have been given
                # an OAuth bearer access token to make API calls on her
                # behalf. Save the token.
                token = location.hash.split(':')[1]
                Maltio.auth = token

                # Get basic user info and save it for display
                Maltio.get 'profile', {}, (profile) ->
                    profile.token = token
                    self.user profile

            @get '/', (req) ->
                self.page 'home'
                self.crumbs []

        router.configure (config) ->
            # Make sure to load the current URL
            config.generateRequestOnPageLoad = true

            router.start()

    login: ->
        location.href = Maltio.authorizeUrl()

    logout: ->
        @user null

###
A binding handler to set the HTML5 contenteditable attribute
if an observable is true.
###
ko.bindingHandlers.editable =
    update: (element, valueAccessor) ->
        value = ko.utils.unwrapObservable valueAccessor()
        if value
            $(element).attr 'contenteditable', true
        else
            $(element).removeAttr 'contenteditable'

###
A binding handler for elements with the HTML5 contenteditable
attribute set on them.
###
ko.bindingHandlers.editableText =
    init: (element, valueAccessor, allBindingsAccessor) ->
        $(element).on 'blur', ->
            allBindings = allBindingsAccessor()
            observable = valueAccessor()
            value = $(@).text()

            value = switch allBindings.type
                when 'fixed1', 'fixed2'
                    parseFloat value
                when 'int'
                    parseInt value
                when 'bool'
                    value.toLowercase() in ['true', 'yes', 'on']
                else value

            observable value
      
    update: (element, valueAccessor, allBindingsAccessor) ->
        allBindings = allBindingsAccessor()
        value = ko.utils.unwrapObservable valueAccessor()

        value = switch allBindings.type
            when 'fixed1' then value.toFixed 1
            when 'fixed2' then value.toFixed 2
            when 'int' then Math.round value
            when 'bool'
                if value then 'yes' else ''
            else value

        $(element).text value

app = new AppViewModel()
ko.applyBindings app
