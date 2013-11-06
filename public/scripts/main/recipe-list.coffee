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
