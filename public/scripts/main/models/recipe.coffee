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
