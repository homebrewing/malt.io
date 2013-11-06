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
