# Utilities to draw maps
class Mapping
    @loaded: ->
        # Called when Google Maps has loaded asyncronously

    @draw: (id, lat, lng) =>
        drawMap = ->
            if window.google is undefined or google.maps is undefined or google.maps.LatLng is undefined
                console.log 'Waiting for Google Maps to load...'
                return setTimeout drawMap, 250

            mapOptions =
                center: new google.maps.LatLng lat or 40.7142, lng or -74.0064
                zoom: 11
                mapTypeId: google.maps.MapTypeId.ROADMAP
                mapTypeControl: false
                streetViewControl: false
                scrollwheel: false
                draggableCursor: 'default'

            map = new google.maps.Map document.getElementById(id), mapOptions

            google.maps.event.addListener map, 'center_changed', ->
                center = map.getCenter()

                #$('#lat').val center.lat()
                #$('#lng').val center.lng()

            map.setOptions
                styles: [
                    {
                      "featureType": "water",
                      "stylers": [
                        { "visibility": "simplified" },
                        { "hue": "#ffc300" },
                        { "saturation": -83 },
                        { "lightness": -19 }
                      ]
                    },{
                      "featureType": "landscape",
                      "stylers": [
                        { "visibility": "on" },
                        { "color": "#ffffff" }
                      ]
                    },{
                      "featureType": "road",
                      "stylers": [
                        { "saturation": -83 },
                        { "visibility": "on" },
                        { "hue": "#ff9900" },
                        { "lightness": 18 }
                      ]
                    },{
                      "featureType": "poi",
                      "stylers": [
                        { "visibility": "on" },
                        { "saturation": -50 }
                      ]
                    },{
                      "featureType": "transit.line",
                      "stylers": [
                        { "visibility": "simplified" },
                        { "lightness": 21 },
                        { "saturation": -51 }
                      ]
                    }
                  ]

        drawMap()
