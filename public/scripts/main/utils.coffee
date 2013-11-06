# Utilities

# Capitalize a string
capitalize = (value) ->
    value.charAt(0).toUpperCase() + value.slice(1)

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
