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
