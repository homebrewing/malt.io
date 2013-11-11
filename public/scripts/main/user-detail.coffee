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

            Mapping.draw 'user-detail-map', users[0].location[1], users[0].location[0]
