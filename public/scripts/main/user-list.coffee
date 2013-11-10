class UserListViewModel extends PagedViewModel
    constructor: ->
        super '-created'
        @users = ko.observableArray()

        @userIds = ko.observable()

        @userIds.subscribe =>
            @update()

        @displaySort = ko.computed
            read: =>
                switch @sort()
                    when 'created' then 'Oldest'
                    when '-created' then 'Newest'
                    when 'name' then 'Name'
                    else 'Custom'

    update: (done) ->
        options =
            offset: @perPage() * @page()
            limit: @perPage()
            sort: @sort()

        if @userIds() and @userIds().length
            options.ids = @userIds().join ','

        Maltio.get 'public/users', options, (users) =>
            @users users
            done?()
