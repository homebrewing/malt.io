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

        @example = ko.observable 'danielgtaylor/wPYGw'

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
        @router = Davis ->
            @get '/dashboard', (req) ->
                self.page 'dashboard'
                self.crumbs [['home', '/'], ['dashboard', '']]

            @get '/users/:username/recipes/:slug', (req) ->
                self.recipeDetail.load req.params.username, req.params.slug, ->
                    self.recipeDetail.edit false
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

            @get '/new', (req) ->
                self.recipeDetail.clear()
                self.recipeDetail.edit true
                self.page 'recipeDetail'
                self.crumbs [['home', '/'], ['New Recipe', '']]

            @get '/developers', (req) ->
                self.page 'developers'
                self.crumbs [['home', '/'], ['developers', '']]

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

                    Davis.location.assign '/dashboard'

            @get '/', (req) ->
                self.recipeList.baseUrl '/recipes'
                self.recipeList.setUser null, ->
                    self.page 'home'
                    self.crumbs []
                    self.recipeList.page 0

        @router.configure (config) ->
            # Make sure to load the current URL
            config.generateRequestOnPageLoad = true

            self.router.start()

    login: ->
        location.href = Maltio.authorizeUrl()

    logout: ->
        @user null

# Start the application and routing
window.app = new AppViewModel()
ko.applyBindings window.app

# Display the application and hide loading bar
$('#loading, #contentContainer').toggle();
