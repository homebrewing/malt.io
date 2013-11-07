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
        Maltio.del "recipes/#{@recipe().id}", {}, (res) ->
            Davis.location.assign '/recipes'

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
