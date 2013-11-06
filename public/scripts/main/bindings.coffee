###
A binding handler to set the HTML5 contenteditable attribute
if an observable is true.
###
ko.bindingHandlers.editable =
    update: (element, valueAccessor) ->
        value = ko.utils.unwrapObservable valueAccessor()
        if value
            $(element).attr 'contenteditable', true
        else
            $(element).removeAttr 'contenteditable'

###
A binding handler for elements with the HTML5 contenteditable
attribute set on them.
###
ko.bindingHandlers.editableText =
    init: (element, valueAccessor, allBindingsAccessor) ->
        $(element).on 'blur', ->
            allBindings = allBindingsAccessor()
            observable = valueAccessor()
            value = $(@).text()

            value = switch allBindings.type
                when 'fixed1', 'fixed2'
                    parseFloat value
                when 'int'
                    parseInt value
                when 'bool'
                    value.toLowercase() in ['true', 'yes', 'on']
                else value

            observable value
      
    update: (element, valueAccessor, allBindingsAccessor) ->
        allBindings = allBindingsAccessor()
        value = ko.utils.unwrapObservable valueAccessor()

        value = switch allBindings.type
            when 'fixed1' then value.toFixed 1
            when 'fixed2' then value.toFixed 2
            when 'int' then Math.round value
            when 'bool'
                if value then 'yes' else ''
            else value

        $(element).text value
