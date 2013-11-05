# Utilities
capitalize = (value) ->
    value.charAt(0).toUpperCase() + value.slice(1)

###
Malt.io API client
###
class Maltio
    @auth: null
    @version: 1
    @clientId: '5262cc03ba318e4ff21d7d6d'
    @host: 'https://api.malt.io'
    @redirect: 'http://beta.malt.io/auth/callback'
    # Uncomment the lines below for local testing
    #@host: 'http://localhost:2337'
    #@redirect: 'http://localhost:9000/auth/callback'
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
    constructor: (defaultSort=null) ->
        # Paging variables
        @perPage = ko.observable 25
        @page = ko.observable 0
        @sort = ko.observable defaultSort

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

        @sort.subscribe (value) =>
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
                @recipes (new RecipeModel(recipe) for recipe in recipes)

            Maltio.get 'public/actions', {userIds: users[0].id}, (actions) =>
                @actions actions

            done?()

            Mapping.draw 'user-detail-map', users[0].location[0], users[0].location[1]

class RecipeListViewModel extends PagedViewModel
    constructor: ->
        super '-created'
        @user = null
        @baseUrl = ko.observable '/recipes'
        @recipes = ko.observableArray()

        @displaySort = ko.computed
            read: =>
                switch @sort()
                    when 'created' then 'Oldest'
                    when '-created' then 'Newest'
                    when 'name' then 'Name'
                    else 'Custom'

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
            sort: @sort()
            offset: @perPage() * @page()
            limit: @perPage()
            detail: true

        if @user
            options.userIds = @user.id

        Maltio.get 'public/recipes', options, (recipes) =>
            @recipes (new RecipeModel(recipe) for recipe in recipes)
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
                    Brauhaus.yieldToPpg self.yield()

            write: (value) ->
                yieldAmount = if isNaN value then undefined else
                    Brauhaus.ppgToYield value
                self.yield yieldAmount

        @weightPercent = ko.observable 0

    toJSON: ->
        color: @color()
        late: @late()
        name: @name()
        weight: @weight()
        yield: @yield()

class SpiceModel
    constructor: (recipe, apiSpice) ->
        self = this

        @recipe = recipe

        for property in ['aa', 'form', 'name', 'time', 'use', 'weight']
            @[property] = ko.observable apiSpice[property]
            @[property].subscribe ->
                self.recipe.calculate()

        self['weightG'] = ko.computed
            read: ->
                if isNaN self.weight() then undefined else
                    self.weight() * 1000

            write: (value) ->
                self.weight(value / 1000)

        self['weightOz'] = ko.computed
            read: ->
                if isNaN self.weight() then undefined else
                    Brauhaus.kgToLb(self.weight()) * 16.0

            write: (value) ->
                kg = Brauhaus.lbToKg(value / 16.0)
                self.weight kg

    toJSON: ->
        aa: @aa()
        form: @form()
        name: @name()
        time: @time()
        use: @use()
        weight: @weight()

class YeastModel
    constructor: (recipe, apiYeast) ->
        self = this

        @recipe = recipe

        for property in ['attenuation', 'form', 'name', 'type']
            @[property] = ko.observable apiYeast[property]
            @[property].subscribe ->
                self.recipe.calculate()

    toJSON: ->
        attenuation: @attenuation()
        form: @form()
        name: @name()
        type: @type()

class RecipeModel
    @calculatedValues = ['og', 'ogPlato', 'fg', 'fgPlato', 'ibu', 'abv', 'color', 'bv', 'calories', 'primingCornSugar', 'primingDme', 'primingHoney', 'primingSugar', 'boilStartTime', 'boilEndTime', 'brewDayDuration']

    constructor: (apiResponse) ->
        self = this

        @id = apiResponse.id
        @user = apiResponse.user
        @slug = apiResponse.slug

        apiRecipe = apiResponse.data

        # Set some sane defaults
        if apiRecipe.bottlingTemp is 0 then apiRecipe.bottlingTemp = Brauhaus.ROOM_TEMP
        if apiRecipe.bottlingPressure is 0 then apiRecipe.bottlingPressure = 2.5

        for property in ['name', 'description', 'style', 'batchSize', 'boilSize', 'ibuMethod', 'bottlingTemp', 'bottlingPressure', 'mashEfficiency', 'steepEfficiency']
            @[property] = ko.observable apiRecipe[property]
            @[property].subscribe ->
                self.calculate()

        for property in RecipeModel.calculatedValues
            @[property] = ko.observable apiRecipe[property]

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

        for property in ['bottlingTemp']
            do (property) ->
                self["#{property}F"] = ko.computed
                    read: ->
                        if isNaN self[property]() then undefined else
                            Brauhaus.cToF self[property]()
                    write: (value) ->
                        c = if isNaN value then undefined else
                            Brauhaus.fToC parseFloat(value)
                        self[property] c

        @colorEbc = ko.computed
            read: ->
                if isNaN self.color() then undefined else
                    Brauhaus.srmToEbc self.color()

            write: (value) ->
                srm = if isNaN value then undefined else
                    Brauhaus.ebcToSrm value
                self.color srm

        @bottleCount = ko.observable 0

        @fermentables = ko.observableArray()
        @fermentables (new FermentableModel(self, x) for x in apiRecipe.fermentables or [])
        @fermentables.subscribe ->
            self.calculate()

        @spices = ko.observableArray (new SpiceModel(self, x) for x in apiRecipe.spices or [])
        @spices.subscribe ->
            self.calculate()

        @yeast = ko.observableArray (new YeastModel(self, x) for x in apiRecipe.yeast or [])
        @yeast.subscribe ->
            self.calculate()

        @timeline = null
        @timelineUs = null

    toJSON: ->
        name: @name()
        description: @description()
        style: @style()
        batchSize: @batchSize()
        boilSize: @boilSize()
        ibuMethod: @ibuMethod()
        bottlingTemp: @bottlingTemp()
        bottlingPressure: @bottlingPressure()
        fermentables: (x.toJSON() for x in @fermentables())
        spices: (x.toJSON() for x in @spices())
        yeast: (x.toJSON() for x in @yeast())

    addFermentable: (name, yieldAmt, srm) ->
        @fermentables.push new FermentableModel(this,
            name: name
            weight: 1.0
            yield: yieldAmt
            color: srm
        )

    removeFermentable: (fermentable) ->
        fermentable.recipe.fermentables.remove fermentable

    addSpice: (name, aa) ->
        # TODO time logic
        @spices.push new SpiceModel(this,
            aa: aa,
            form: aa and 'pellet' or 'ground'
            name: name
            time: 60
            use: 'boil'
            weight: 0.028
        )

    removeSpice: (spice) ->
        spice.recipe.spices.remove spice

    addYeast: (name, type, form, attenuation) ->
        @yeast.push new YeastModel(this,
            attenuation: attenuation
            form: form
            name: name
            type: type
        )

    removeYeast: (yeast) ->
        yeast.recipe.yeast.remove yeast

    calculate: ->
        if @_updating then return
        @_updating = true

        temp = new Brauhaus.Recipe @toJSON()
        temp.calculate()
        @timeline = temp.timeline(true)
        @timelineUs = temp.timeline(false)

        for property in RecipeModel.calculatedValues
            @[property] temp[property]

        # Update fermentable ordering and weight percentages
        total = 0
        for item in @fermentables()
            total += item.weight()

        for item in @fermentables()
            item.weightPercent item.weight() / total * 100

        @bottleCount temp.bottleCount()

        @fermentables.sort (left, right) ->
            if left.weight() > right.weight() then -1 else 1

        @spices.sort (left, right) ->
            if left.time() > right.time() then -1 else 1

        @yeast.sort (left, right) ->
            if left.attenuation() > right.attenuation() then -1 else 1

        @_updating = false

    toBeerXml: ->
        temp = new Brauhaus.Recipe @toJSON()
        temp.calculate()
        temp.toBeerXml()

    displayTimeline: (metric=true) ->
        last = 0
        timeline = []

        for [min, desc] in metric and @timeline or @timelineUs
            if min - last > 1440
                timeline.push ['...', '']

            last = min

            if min < @boilStartTime()
                min = 'boil'
            else if min < @boilEndTime()
                min = "-#{min - @boilEndTime()} minutes"
            else if min is @boilEndTime()
                min = "0 minutes"
            else
                min = Brauhaus.displayDuration(min - @boilEndTime(), 2)

            timeline.push [min, desc]

        timeline

class RecipeDetailViewModel
    fermentableTemplates: [
        ['Malt extract', [
            ['Extra pale liquid extract', 80, 2],
            ['Extra light dry extract', 90, 2.5],
            ['Pale liquid extract', 76, 4],
            ['Maris Otter liquid extract', 78, 4.5],
            ['Amber liquid extract', 75, 10],
            ['Dark liquid extract', 75, 30],
            ['Wheat liquid extract', 75, 3],
            ['Wheat dry extract', 90, 3],
            ['Rye liquid extract', 75, 6]
        ]],
        ['Base malt', [
            ['Pilsner malt', 74, 1],
            ['Pale 2-row malt', 80, 2],
            ['Pale 6-row malt', 73, 2],
            ['Munich malt', 80, 8],
            ['Wheat malt', 80, 3],
            ['Rye malt', 63, 4]
        ]],
        ['Caramel malt', [
            ['Carapils', 75, 1.5],
            ['Caramel 10L', 75, 10],
            ['Caramel 20L', 75, 20],
            ['Caramel 30L', 74, 30],
            ['Caramel 40L', 73, 40],
            ['Caramel 60L', 72, 60],
            ['Caramel 80L', 71, 80],
            ['Caramel 120L', 70, 120],
            ['Special B', 74, 147]
        ]],
        ['Roasted malt', [
            ['Biscuit', 75, 23],
            ['Chocolate', 65, 350],
            ['Black malt', 60, 500],
            ['Roasted barley', 70, 500]
        ]],
        ['Adjuncts', [
            ['Flaked barley', 70, 2],
            ['Flaked wheat', 74, 2],
            ['Flaked oats', 72, 2],
            ['Flaked rye', 78, 3],
            ['Flaked rice', 85, 0.5],
            ['Flaked corn', 85, 0.5],
        ]],
        ['Sugar', [
            ['Table sugar', 100, 0],
            ['Corn sugar', 100, 0.5],
            ['Clover honey', 90, 2],
            ['Lactose', 75, 1],
            ['Belgian light candi', 80, 1],
            ['Belgian dark candi', 80, 60],
            ['D-45 candi syrup', 70, 45],
            ['D-90 candi syrup', 70, 90],
            ['D-180 candi syrup', 70, 180]
        ]]
    ]

    spiceTemplates: [
        ['US - A to M', [
            ['Ahatanum', 5],
            ['Amarillo', 8],
            ['Cascade', 6],
            ['Centennial', 10],
            ['Chinook', 12],
            ['Citra', 10],
            ['Cluster', 7],
            ['Columbus', 14],
            ['Crystal', 3.5],
            ['Glacier', 6],
            ['Horizon', 12.5],
            ['Liberty', 4.5],
            ['Magnum', 14.5],
            ['Mt. Hood', 4.5]
        ]],
        ['US - N to Z', [
            ['Nugget', 12],
            ['Palisade', 6],
            ['Santiam', 6],
            ['Simcoe', 13],
            ['Sterling', 7.5],
            ['Summit', 18],
            ['Target', 9],
            ['Ultra', 3],
            ['US Saaz', 3],
            ['Warrior', 16.5],
            ['Willamett', 4.5],
            ['Zeus', 16]
        ]],
        ['UK hops', [
            ['Bambling Cross', 6],
            ['Brewers Gold', 8],
            ['Challenger', 7],
            ['East Kent Goldings', 5.5],
            ['First Gold', 7.5],
            ['Fuggles', 4.5],
            ['Northdown', 9.5],
            ['Progress', 6.0],
            ['Whitbread Goldings', 6],
            ['Yeoman', 7]
        ]],
        ['German hops', [
            ['German Tradition', 6],
            ['Hallertau Hersbrucker', 3.5],
            ['Hallertau Mittelfrüh', 4.5],
            ['Northern Brewer', 8.5],
            ['Orion', 7],
            ['Perle', 7],
            ['Spalt', 4.5],
            ['Tettnanger', 4.5]
        ]],
        ['Other hops', [
            ['B.C. Goldings', 5.5],
            ['Czech Saaz', 3.5],
            ['Pride of Ringwood', 10],
            ['Stickelbract', 10.5],
            ['Strisselspalt', 3],
            ['Styrian Goldings', 5.5]
        ]],
        ['Spices', [
            ['Anise', 0],
            ['Caraway', 0],
            ['Cardamom', 0],
            ['Chamomile', 0],
            ['Clove', 0],
            ['Cinnamon', 0],
            ['Coriander', 0],
            ['Ginger', 0],
            ['Grains of paradise', 0],
            ['Irish moss', 0],
            ['Jasmine', 0],
            ['Lavender', 0],
            ['Orange peel', 0],
            ['Pepper', 0],
            ['Rose hips', 0]
        ]]
    ]

    yeastTemplates: [
        ['Wyeast Ale', [
            ['Wyeast 1010 - American Wheat', 'ale', 'liquid', 78],
            ['Wyeast 1056 - American Ale', 'ale', 'liquid', 77],
            ['Wyeast 1214 - Belgian Abbey', 'ale', 'liquid', 78],
            ['Wyeast 1388 - Belgian Strong Ale', 'ale', 'liquid', 78],
            ['Wyeast 1728 - Scottish Ale', 'ale', 'liquid', 73],
            ['Wyeast 1762 - Belgian Abbey II', 'ale', 'liquid', 77],
            ['Wyeast 3068 - Weihenstephan Weizen', 'ale', 'liquid', 77],
            ['Wyeast 3711 - French Saison', 'ale', 'liquid', 83],
            ['Wyeast 3724 - Belgian Saison', 'ale', 'liquid', 80],
            ['Wyeast 3944 - Belgian Witbier', 'ale', 'liquid', 76]
        ]],
        ['Wyeast Lager', [
            ['Wyeast 2000 - Budvar Lager', 'lager', 'liquid', 75],
            ['Wyeast 2035 - American Lager', 'lager', 'liquid', 77],
            ['Wyeast 2206 - Bavarian Lager', 'lager', 'liquid', 77],
            ['Wyeast 2278 - Czech Pils', 'lager', 'liquid', 74]
        ]],
        ['White Labs Ale', [
            ['WLP001 - California Ale', 'ale', 'liquid', 76],
            ['WLP002 - English Ale', 'ale', 'liquid', 67],
            ['WLP004 - Irish Ale', 'ale', 'liquid', 72],
            ['WLP029 - German Ale / Kölsch', 'ale', 'liquid', 75],
            ['WLP300 - Hefeweizen Ale', 'ale', 'liquid', 74],
            ['WLP400 - Belgian Wit Ale', 'ale', 'liquid', 76],
            ['WLP500 - Trappist Ale', 'ale', 'liquid', 78],
            ['WLP530 - Abbey Ale', 'ale', 'liquid', 78],
            ['WLP565 - Belgian Saison I', 'ale', 'liquid', 70]
        ]],
        ['White Labs Lager', [
            ['WLP800 - Pilsner Lager', 'lager', 'liquid', 74],
            ['WLP810 - San Franscisco Lager', 'lager', 'liquid', 68],
            ['WLP820 - Oktoberfest / Märzen Lager', 'lager', 'liquid', 69],
            ['WLP830 - German Lager', 'lager', 'liquid', 76],
            ['WLP840 - American Lager', 'lager', 'liquid', 77],
            ['WLP940 - Mexican Lager', 'lager', 'liquid', 74]
        ]],
        ['Dry yeast', [
            ['Safale US-05', 'ale', 'dry', 72],
            ['Safale S-04', 'ale', 'dry', 72],
            ['Safbrew S-33', 'ale', 'dry', 72],
            ['Safbrew T-58', 'ale', 'dry', 72],
            ['Safbrew WB-06', 'ale', 'dry', 72],
            ['Saflager S-23', 'lager', 'dry', 72]
        ]],
        ['Other bugs', [
            ['Wyeast 5112 - Brettanomyces bruxellensis', 'other', 'liquid', 85],
            ['Wyeast 5526 - Brettanomyces lambicus', 'other', 'liquid', 85],
            ['WLP650 - Brettanomyces bruxellensis', 'other', 'liquid', 85],
            ['WLP653 - Brettanomyces lambicus', 'other', 'liquid', 85]
            ['Wyeast 5733 - Pediococcus', 'other', 'liquid', 0],
            ['Wyeast 5335 - Lactobacillus', 'other', 'liquid', 0],
            ['WLP677 - Lactobacillus', 'other', 'liquid', 0]
        ]]
    ]

    constructor: ->
        @edit = ko.observable false
        @recipe = ko.observable()

    load: (username, slug, done) ->
        console.log "Loading recipe #{username}/#{slug}"
        Maltio.get 'public/users', {names: username}, (users) =>
            Maltio.get 'public/recipes', {userIds: users[0].id, slugs: slug}, (recipes) =>
                recipe = new RecipeModel(recipes[0])
                recipe.calculate()
                @recipe recipe
                done?()

    toggleEdit: ->
        @edit not @edit()

    save: ->
        postSave = (recipe) ->
            console.log recipe
            Davis.location.assign "/users/#{recipe.user.name}/recipes/#{recipe.slug}"

        if @recipe().id
            Maltio.put "recipes/#{@recipe().id}", {recipe: @recipe().toJSON()}, postSave
        else
            Maltio.post 'recipes', {recipe: @recipe().toJSON()}, postSave

    clone: ->
        Maltio.post 'recipes', {recipe: @recipe().toJSON()}, (res) ->
            console.log res

    exportBeerXml: ->
        xml = @recipe().toBeerXml()

        blob = new Blob [xml], type: 'text/xml'
        url = URL.createObjectURL blob

        window.saveAs blob, "#{@recipe().slug}.xml"

    delConfirm: ->
        console.log 'Not implemented!'

    # Clear all recipe data
    clear: ->
        fakeRecipe =
            id: null
            user: self.user
            slug: 'no-slug-yet'
            data: new Brauhaus.Recipe()
        recipe = new RecipeModel fakeRecipe
        recipe.calculate()

        @recipe recipe

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
