class UserListViewModel extends PagedViewModel
    constructor: ->
        super()
        @users = ko.observableArray()

    update: (done) ->
        offset = @perPage() * @page()
        Maltio.get 'public/users', {offset, limit: @perPage()}, (users) =>
            @users users
            done?()
