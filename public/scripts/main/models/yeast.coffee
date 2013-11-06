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
