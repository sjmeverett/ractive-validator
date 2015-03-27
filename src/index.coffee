
((factory) ->
  if typeof exports is 'object'
    # node.js-type environment
    module.exports = factory(
      try require('moment'),
      try require('q')
    )
  else if typeof define is 'function' and define.amd
    # amd (requirejs etc)
    # meh, can't figure out optional dependencies here, pull requests welcome
    define ['moment', 'q'], factory
  else if window?
    # browser
    window.Validator = factory(window.moment, window.Q)
  
)((moment, Q) ->
  global = class RactiveValidator
    ##
    # Creates a new validator
    # @param model (optional)
    # @param basePath (optional)
    # @param rules
    constructor: () ->
      # get the arguments
      switch arguments.length
        when 3
          [@basePath, @model, @rules] = arguments
          @basePath = @basePath + '.'
        when 2
          @rules = arguments[1]

          if typeof arguments[0] == 'string'
            @basePath = arguments[0] + '.'
          else
            @basePath = ''
            @model = arguments[0]
        when 1
          @rules = arguments[0]
          @basePath = ''
        else
          throw new Error('wrong number of arguments')

      # set some defaults
      @validators = RactiveValidator.validators
      @errorSuffix = 'Msg'
      @enabled = true

      # set up observers if necessary
      if @model?.observe?
        @observeModel()
    
    
    ##
    # Set up observers on model
    # 
    observeModel: ->
      for rulepath in @rules
        @model.observe rulepath, (newValue, oldValue, keypath) =>
            if @enabled
              @validateKeypath newValue, keypath, result, @rules[rulepath]
          ,
            init: false
    
    
    ##
    # Sets whether or not the observing validation is enabled
    #
    enable: (value) ->
      @enabled = value
      # clear the error messages
      @model.set(@basePath + keypath + @errorSuffix) for keypath in @rules

    
    ##
    # Validates either the model given in the constructor or as an argument
    # @param model (optional) the model to validate
    # @returns a validation object
    validate: (model) ->
      result =
        valid: true
        model: model or @model
        errors: new ObjectModel()
        data: new ObjectModel()
        groups: []
        immediate: model?
      
      # wrap POJOs in an ObjectModel
      if not (result.model.get and result.model.set)
        result.model = new ObjectModel result.model
      
      # polyfill models without expandKeypath method (i.e., ractive)
      if not result.model.expandKeypath
        result.model.expandKeypath = ObjectModel.prototype.expandKeypath

      # validate the model
      promises = []
      
      for keypath, rules of @rules
        p = @validateWildcardKeypath @basePath + keypath, result, rules
        promises.push p if p?.then

      # return the results
      if promises.length
        return Q.all(promises).then =>
          valid: result.valid
          errors: result.errors.model
          data: result.data.get(@basePath.substring(0, @basePath.length - 1))
      else
        valid: result.valid
        errors: result.errors.model
        data: result.data.get(@basePath.substring(0, @basePath.length - 1))
    
    
    ##
    # Validates a keypath possibly containing a wildcard
    #
    validateWildcardKeypath: (keypath, result, rules) ->
      paths = result.model.expandKeypath keypath
      promises = []
      
      for path in paths
        p = @validateKeypath result.model.get(path), path, result, rules
        promises.push p if p?.then
      
      if promises.length
        if not Q?
          throw new Error 'need Q library for promises support'
        return Q.all promises
    
    
    ##
    # Validates a specific keypath
    #
    validateKeypath: (value, keypath, result, rules) ->
      coerced = undefined
      
      # this code is crazy in order to support there sometimes being promises -
      # it boils down more or less to a simple iteration over the keys and values
      # in the rules argument, only continuing to the next if the current succeeded
      
      # what to do with each rule
      fn = (i, rules) =>
        {rule, ruleValue} = rules[i]
        
        # if it's not a known rule, but it does define a function, use that function
        if not @validators.hasOwnProperty(rule)
          if typeof ruleValue is 'function'
            validator = ruleValue
          else
            throw new Error "validator #{rule} not defined"
        else
          validator = @validators[rule]

        # validate
        validation = validator.call(this, value, ruleValue, result)
        
        # what to do after each rule
        coda = (validation) =>
          if validation.valid
            # clear the error message if necessary
            result.model.set(keypath + @errorSuffix, undefined) if not result.immediate
            
            # save the coerced value if there is one
            coerced = validation.coerced if typeof validation.coerced != 'undefined'
            
            # continue, if necessary
            if i < rules.length - 1
              fn i + 1, rules
          else
            # not valid, set the error message and break
            result.valid = false
            result.errors.set keypath, validation.error
            result.model.set(keypath + @errorSuffix, validation.error) if not result.immediate
        
        # call the coda somehow, depending whether or not we have a promise
        if validation.then
          validation.then coda
        else
          coda validation
      
      # step through each rule in turn
      r = fn 0, ({rule, ruleValue} for rule, ruleValue of rules)
      
      # what to do after all the rules
      coda = ->
        # if it was valid, set the corresponding result.data
        if result.valid
          result.data.set(keypath, if typeof coerced != 'undefined' then coerced else value)
      
      if r?.then
        r.then coda
      else
        coda()


    ##
    # Define the built-in validators
    #
    @validators:
      ##
      # A 'required' validator, with support for groups
      #
      required: (value, required, result) ->
        # check if it's actually required
        if required
          if typeof required == 'string'
            # it's a require group, rather than a straight true or false
            [match, groupName, groupValue] = required.match(/([^\.]+)=(.+)/) or []

            if not match
              throw new Error 'invalid require rule: ' + required

            group = result.groups[groupName]

            if not value? or value == ''
              # value doesn't exist, should it?
              if group == groupValue
                # it should
                return valid: false, error: 'required'
              else
                # it shouldn't
                return valid: true
            else
              # value exists, should it?
              if group == undefined
                # first time we've encountered this group
                # make the rest of the things in the group required
                result.groups[groupName] = groupValue
                return valid: true
              else if group == groupValue
                # it should exist, and it does
                return valid: true
              else
                # it shouldn't exist
                return valid: false, error: 'not required'
          else
            # it's a straight true or false
            if not value? or value == ''
              return valid: false, error: 'required'
            else
              return valid: true
        else
          # not required, always valid
          return valid: true


      ##
      # A validator for 'confirm password' fields
      #
      password: (value, otherField, result) ->
        if value == result.model.get(otherField)
          return valid: true
        else
          return valid: false, error: 'passwords must match'


      ##
      # Checks that the input matches a given moment.js format, with support for
      # coercing to a moment object or a different format
      #
      moment: (value, format) ->
        if not moment?
          throw new Error 'need moment.js library for moment validator'
          
        # allow coerce format to be specified
        if typeof format != 'string'
          {format, coerce} = format

        # don't attempt anything if it's empty
        if not value? or value == ''
          return valid: true

        # check if it's valid
        m = moment(value, format, true)

        if m.isValid()
          if coerce == true
            return valid: true, coerced: m
          else if typeof coerce == 'string'
            return valid: true, coerced: m.format(coerce)
          else
            return valid: true
        else
          return valid: false, error: 'must be ' + format


      ##
      # Checks that the input is the specified data type - will attempt to coerce
      # from string for model validation
      #
      type: (value, type, result) ->
        # don't attempt anything if there isn't a value
        if not value?
          return valid: true

        # string
        if type == 'string'
          if typeof value != 'string'
            return valid: false, error: 'must be a string'
          else
            return valid: true

        # integer
        else if type == 'integer'
          if value == ''
            return valid: true, coerced: null
          else if (typeof value == 'number' and (value % 1) != 0) or
              (typeof value != 'number' and result.immediate) or
              (value? and value != '' and not /^(\-|\+)?([0-9]+)$/.test(value))
            return valid: false, error: 'must be a whole number'
          else
            return valid: true, coerced: Number(value)

        # decimal
        else if type == 'decimal'
          if value == ''
            return valid: true, coerced: null
          else if (typeof value != 'number' and result.immediate) or
              (value? and value != '' and not /^(\-|\+)?([0-9]+(\.[0-9]+)?)$/.test(value))
            return valid: false, error: 'must be a decimal'
          else
            return valid: true, coerced: Number(value)

        # boolean
        else if type == 'boolean'
          if value == ''
            return valid: true, coerced: null
          else if (typeof value != 'boolean' and result.immediate) or
              (value? and value != '' and not /^(true|false)$/.test(value))
            return valid: false, error: 'must be a boolean'
          else
            return valid: true, coerced: value == 'true' || value == true

        # unknown type
        else
          throw new Error('unknown data type ' + type)


      ##
      # Checks that the input is positive
      #
      positive: (value, type) ->
        if value >= 0
          return valid: true
        else
          return valid: false, error: 'must be positive'


  global.ObjectModel = class ObjectModel
    constructor: (model) ->
      @model = model or {}


    ##
    # Gets the value(s) at a keypath
    #
    get: (keypath) ->
      if not keypath
        return @model
      
      # expand wild cards etc to get a list of keypaths
      paths = @expandKeypath keypath

      # map the list of keypaths to the values therein
      results = paths.map (keypath) =>
        {object, child} = @getObj @model, keypath
        return object[child]

      # return the list of values, or if it's just one, return it on its own
      if paths.length > 1
        return results
      else
        return results[0]


    ##
    # Sets the value at a keypath
    #
    set: (keypath, value) ->
       # expand wild cards etc to get a list of keypaths
      paths = @expandKeypath keypath

      # set the value at each keypath to the given value
      for keypath in paths
        {object, child} = @getObj @model, keypath
        object[child] = value


    ##
    # Expands paths with wildcards to a list of paths
    # 
    expandKeypath: (keypath, paths) ->
      paths = paths or []

      # match wildcards
      [match, start, path, remainder] = keypath.match(/^(([^\*]+)\.)?\*(\..*)?$/) or []

      if match
        # wildcard present, keep recursing
        @expandKeypath(start + k + remainder, paths) for k of @get(path)
      else
        # no wildcard, add to the list of paths
        paths.push(keypath)

      return paths


    ##
    # Gets a reference to a keypath location
    #
    getObj: (obj, keypath) ->
      pos = keypath.indexOf '.'

      if pos == -1
        # simple path, return the reference
        return {}=
          object: obj
          child: keypath
      else
        # path with at least 1 child, recurse
        # match the parent, immediate child, and remaining keypaths
        [match, parent, remainder, child] = keypath.match(/^([^\.]+)\.(([^\.]+).*)$/)

        # if it doesn't exist, create it
        if not obj.hasOwnProperty parent
          obj[parent] = if isNaN(parseInt(child)) then {} else []

        return @getObj obj[parent], remainder
  
  return global
)