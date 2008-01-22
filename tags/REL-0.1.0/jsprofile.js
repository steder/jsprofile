//******************************************************************************
// Tools

/**
 * Return an array containing all properties of an object. Perl-style.
 *
 * @param object  the object whose keys to return
 * @return        array of object keys, as strings
 */
function keys(object)
{
    var keys = [];
    for (var k in object) {
        keys.push(k);
    }
    return keys;
}



/**
 * Rounds a decimal value to nPlaces places. This may fail if both the number
 * and nPlaces are large, due to the quick and dirty way rounding is performed.
 *
 * @param value    the value to round
 * @param nPlaces  the number of decimal places in the returned value. Should
 *                 be non-negative.
 */
function decimalRound(value, nPlaces)
{
    if (value == 0 || nPlaces < 0) {
        return value;
    }
    var factor = Math.pow(10, nPlaces);
    return Math.round(value * factor) / factor;
}



/**
 * Returns true if two arrays are identical, and false otherwise.
 *
 * @param a1        the first array, may only contain simple values (strings or
 *                   numbers)
 * @param a2        the second array, same restricts on data as for a1
 * @param maxdepth  the maximum depth to compare (specified in cases of
 *                  recursive object structures)
 *
 * @return  true if the arrays are equivalent, false otherwise.
 */
function are_equal(a1, a2, maxdepth, depth)
{
    if (typeof(maxdepth) == 'undefined') {
        maxdepth = Number.MAX_VALUE;
    }
    if (typeof(depth) == 'undefined') {
        var depth = 1;
    }
    if (depth > maxdepth) {
        return true;
    }
    if (typeof(a1) != typeof(a2))
        return false;
    
    switch(typeof(a1)) {
        case 'object':
            // arrays
            if (a1.length) {
                if (a1.length != a2.length)
                    return false;
                for (var i = 0; i < a1.length; ++i) {
                    if (!are_equal(a1[i], a2[i], maxdepth, depth+1))
                        return false
                }
            }
            // associative arrays
            else {
                var keys = {};
                for (var key in a1)   { keys[key] = true; }
                for (var key in a2)   { keys[key] = true; }
                for (var key in keys) {
                    if (!are_equal(a1[key], a2[key], maxdepth, depth+1))
                        return false;
                }
            }
            return true;
            
        default:
            return a1 == a2;
    }
}



/**
 * Emulates php's print_r() functionality. Returns a nicely formatted string
 * representation of an object. Very useful for debugging.
 *
 * @param object    the object to dump
 * @param maxDepth  the maximum depth to recurse into the object. Ellipses will
 *                  be shown for objects whose depth exceeds the maximum.
 * @param indent    the string to use for indenting progressively deeper levels
 *                  of the dump.
 * @return          a string representing a dump of the object
 */
function print_r(object, maxDepth, indent)
{
    var parentIndent, attr, str = "";
    if (arguments.length == 1) {
        var maxDepth = Number.MAX_VALUE;
    } else {
        maxDepth--;
    }
    if (arguments.length < 3) {
        parentIndent = ''
        var indent = '    ';
    } else {
        parentIndent = indent;
        indent += '    ';
    }

    switch(typeof(object)) {
    case 'object':
        if (object.length != undefined) {
            if (object.length == 0) {
                str += "Array ()\r\n";
            }
            else {
                str += "Array (\r\n";
                for (var i = 0; i < object.length; ++i) {
                    str += indent + '[' + i + '] => ';
                    if (maxDepth == 0)
                        str += "...\r\n";
                    else
                        str += print_r(object[i], maxDepth, indent);
                }
                str += parentIndent + ")\r\n";
            }
        }
        else {
            str += "Object (\r\n";
            for (attr in object) {
                str += indent + "[" + attr + "] => ";
                if (maxDepth == 0)
                    str += "...\r\n";
                else
                    str += print_r(object[attr], maxDepth, indent);
            }
            str += parentIndent + ")\r\n";
        }
        break;
    case 'boolean':
        str += (object ? 'true' : 'false') + "\r\n";
        break;
    case 'function':
        str += "Function\r\n";
        break;
    default:
        str += object + "\r\n";
        break;

    }
    return str;
}



/**
 * This object makes it a little easier to construct DOM nodes.
 */
var DOMBuilder = {
    /**
     * Creates a TR element and sets the style of each cell to the specified
     * style, if provided. The content of each created TD element is either
     * a text node if the value is a string, or DOM nodes if the value is a
     * list.
     *
     * @param cellValues   a list of textual values and/or lists of DOM nodes
     *                     for the cells in the row
     * @param styleObject  an object mapping style attributes to their string
     *                     values
     * @param cellTag      optionally specifies the tag name to be used. The
     *                     default is "TD"; "TH" might be a common alternative.
     */
    TR: function(cellValues, styleObject, cellTag) {
        var tr = document.createElement('tr');
        var cellTag = cellTag || 'td';
        for (var i = 0; i < cellValues.length; ++i) {
            tr.appendChild(DOMBuilder._createElement(cellTag, cellValues[i],
                styleObject));
        }
        return tr;
    }
    
    /**
     * Creates an LI element and sets its style.
     */
    , LI: function(value, styleObject) {
        return DOMBuilder._createElement('li', value, styleObject);
    }
    
    , SPAN: function(value, styleObject) {
        return DOMBuilder._createElement('span', value, styleObject);
    }
    
    , BR: function() { return document.createElement('br'); }
    
    , _createElement: function(type, value, styleObject) {
        var element = document.createElement(type);
        if (value instanceof Array) {
            DOMBuilder._appendNodes(element, value);
        }
        else {
            element.appendChild(document.createTextNode(value));
        }
        DOMBuilder._copyStyle(element, styleObject);
        return element;
    }
    
    , _copyStyle: function(node, styleObject) {
        if (styleObject) {
            for (prop in styleObject) {
                node.style[prop] = styleObject[prop];
            }
        }
    }
    
    , _appendNodes: function(parentNode, nodes) {
        for (var i = 0; i < nodes.length; ++i) {
            parentNode.appendChild(nodes[i]);
        }
    }
};



//******************************************************************************
// The ScriptLoader object makes it possible to load the contents of a <script>
// tags whose src attributes reference external scripts. This is done via AJAX,
// so 1) all the scripts must reside on a server (i.e. not locally), and 2)
// the object works by invoking a callback when done.

function ScriptLoader(callback)
{
    /**
     * Creates a new AJAX request object.
     */
    this._createXMLHttpRequest = function() {
        if (window.XMLHttpRequest) {
            return new XMLHttpRequest();
        } 
        else if (window.ActiveXObject) {
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
    };
    
    /**
     * Sends a request and registers a callback for it. The callback is
     * automatically decorated with ready state checking. If specified, a
     * different callback will be invoked if the request fails.
     */
    this._sendXMLHttpRequest = function(request, url, callback, failureCallback)
    {
        if (request) {
            // decorate the callback
            request.onreadystatechange = function() {
                if (request.readyState == 4) {      // "complete"
                    if (request.status == 200) {    // "OK"
                        callback(request);
                    }
                    else {
                        if (failureCallback) {
                            failureCallback(request);
                        }
                    }
                }
            };
            request.open("GET", url, true);
            request.send(null);
        }
    }
    
    /**
     * The main method of this class. Loads the contents of all scripts for the
     * document object, including those whose src attributes reference external
     * resources, and invokes the callback function with the list of script
     * contents as the argument.
     */
    this._callWithScriptContents = function(callback) {
        this.scriptContents = [];
        
        var sources = []
        var scripts = document.getElementsByTagName('script');
        for (var i = scripts.length - 1; i >= 0; --i) {
            if (scripts[i].src) {
                sources.push(scripts[i].src);
            }
            this.scriptContents.push(scripts[i].text);
        }
        var nScripts = this.scriptContents.length + sources.length;
        var scriptLoader = this;
        for (var i = 0; i < sources.length; ++i) {
            var request = this._createXMLHttpRequest();
            this._sendXMLHttpRequest(request, sources[i], function(request) {
                scriptLoader.scriptContents.push(request.responseText);
                // all scripts finished loading?
                if (scriptLoader.scriptContents.length == nScripts) {
                    callback(scriptLoader.scriptContents);
                }
            });
        }
    };
    
    this._callWithScriptContents(callback);
}



//******************************************************************************
// Helper functions for the profiler

/**
 * Identifies special IE objects that should not be treated as typical objects.
 */
function isSpecialIEObject(object)
{
    try {
        if (object.length && object[0].dataFormatAs != undefined) {
            // this particular type of object is self-referential and will hose
            // any recursive object traversal
            return true;
        }
    }
    catch (e) { }
    return false;
}



/**
 * Returns whether the object is a Netscape Interface object (Mozilla)
 */
function isNsIObject(object)
{
    return /^nsI/.test(object + "");
}



/**
 * DOM node?
 */
function isDOMObject(object)
{
    return object.ownerDocument != undefined;
}



function isNativeCode(object)
{
    return (object + "").indexOf('[native code]') != -1
}



//******************************************************************************
// The FunctionInfo object stores all known information about a function.

function FunctionInfo(functionTrace, parentObject)
{
    this.getName = function() {
        return this.trace[this.trace.length-1];
    };
    
    this.getFunction = function() {
        return parentObject[this.getName()];
    };
    
    this.getTraceAsString = function() {
        return this.trace.join('.');
    };
    
    this._init = function(functionTrace, parentObject) {
        this.trace = functionTrace;
        this.parentObject = parentObject;
        this.originalFunction = this.parentObject[this.getName()];
    };
    
    this._init(functionTrace, parentObject);
}



//******************************************************************************
// The ProfileData object is the data structure that holds the profile
// information for each function.

function ProfileData(functionInfo)
{
    this.updateCalculatedValues = function() {
        this.ownTime = this.totalTime - this.nonOwnTime;
        if (this.callCount > 0) {
            this.averageTime = this.totalTime / this.callCount;
            this.averageOwnTime = this.ownTime / this.callCount;
        }
    };

    this._init = function(functionInfo) {
        this.functionInfo = functionInfo;
        
        this.callCount = 0;
        this.totalTime = 0;
        
        // tracks of the start time of all invocations of this function; there
        // can be more than one occurring at any given time.
        this.entryTimes = [];
        
        // the amount of time spent executing subroutines, i.e. not spent
        // executing the body of the function this data is for
        this.nonOwnTime = 0;
        
        // calculated values
        this.ownTime = 0;
        this.averageTime = 0;
        this.averageOwnTime = 0;
    };
    
    this._init(functionInfo);
};



//******************************************************************************
// This is the Profiler object, the guts of the jsprofile library.

function Profiler()
{
    /**
     * The profiler can run in different modes, which determine which functions
     * are profiled. If profiling the functions attached to the window object,
     * the Profiler.MODE_PROFILE_EVERYTHING mode should be set (it is by
     * default).
     */
    this.setMode = function(mode) {
        this._mode = mode;
    };
    
    /**
     * Main entrypoint into this library. Note that new functions that are
     * dynamically added to objects subsequent to a call to start() are NOT
     * individually profiled.
     */
    this.start = function() {
        if (this.getState() == Profiler.STATE_NEW) {
            this._setState(Profiler.STATE_INITIALIZING);
            var self = this;
            if (this._mode == Profiler.MODE_PROFILE_EVERYTHING) {
                // we get the script contents using AJAX; thus for this to work 
                // they probably must be on a webserver, i.e. not accessed via
                // the file:// protocol.
                var variableNames = [];
                var callback = function(scriptContents) {
                    for (var i = 0; i < scriptContents.length; ++i) {
                        var possibleNames =
                            self._lazyParse(scriptContents[i]);
                        for (var j = 0; j < possibleNames.length; ++j) {
                            var possibleName = possibleNames[j];
                            if (window[possibleName]) {
                                variableNames.push(possibleName);
                            }
                        }
                    }
                    self.logger.debug('Found window-scoped variables: '
                        + variableNames.join(', '));
                    setTimeout(function() {
                        self._decorateAllFunctions(window, variableNames);
                        self._setState(Profiler.STATE_RUNNING);
                    }, 1);
                };
                try {
                    scriptLoader = new ScriptLoader(callback);
                }
                catch (e) {
                    this.logger.error('Could not load scripts: '
                        + (e.message ? e.message : e));
                    this._setState(Profiler.STATE_NEW);
                }
            }
            else { // Profiler.MODE_PROFILE_SELECTED_OBJECTS
                setTimeout(function() {
                    for (var i = 0; i < self._selectedObjects.length; ++i) {
                        var selectedObject = self._selectedObjects[i];
                        self._decorateAllFunctions(selectedObject);
                    }
                    self._setState(Profiler.STATE_RUNNING);
                }, 1);
            }
        }
        else if (this.getState() == Profiler.STATE_STOPPED) {
            this._setState(Profiler.STATE_RUNNING);
        }
    };
    
    /**
     * Javascript's single-threaded nature makes this a piece of cake; we don't
     * have to worry about profiling stopping midway for any functions.
     */
    this.stop = function() {
        if (this.getState() == Profiler.STATE_RUNNING) {
            this._setState(Profiler.STATE_STOPPED);
        }
    };
    
    this.reset = function() {
        if (this.getState() == Profiler.STATE_STOPPED) {
            this._clearProfileData();
            this._undecorateAllFunctions();
            this._setState(Profiler.STATE_NEW);
        }
    };
    
    /**
     * Return the profiling results, including calculated results. Functions
     * that were never called are not included in the result set.
     *
     * @return  a list of ProfileData objects
     */
    this.getProfileData = function() {
        var data = [];
        for (var i = 0; i < this.profileData.length; ++i) {
            profileData = this.profileData[i];
            if (profileData.callCount > 0) {
                profileData.updateCalculatedValues();
                data.push(profileData);
            }
        }
        return data;
    };
    
    /**
     * Registers a listener function. Listeners must implement a
     * handleProfilerStateUpdate() method that takes no arguments.
     */
    this.registerStateListener = function(listener) {
        this.stateListeners.push(listener);
    };
    
    this.deregisterStateListener = function(listener) {
        for (var i = 0; i < this.stateListeners.length; ++i) {
            if (this.stateListeners[i] == listener) {
                this.stateListeners.splice(i, 1);
                break;
            }
        }
    };
    
    /**
     * Adds an object for profiling. All functions attached to the object and
     * its descendant objects will be considered for profiling if the profiler
     * mode is Profiler.MODE_PROFILE_SELECTED_OBJECTS .
     */
    this.addSelectedObject = function(selectedObject) {
        this._selectedObjects.push(selectedObject);
    };
    
    /**
     * Clears the list of selected objects.
     */
    this.clearSelectedObjects = function() {
        this._selectedObjects = [];
    };
    
    /**
     * Sometimes you might want to exclude functions from being profiled, such
     * as when their run times are dwarfed by the run time for the profile
     * entry and exit code, or when the function actually manipulates the
     * profiler object and hence will not be profiled correctly.
     */
    this.addExcludedFunction = function(functionToExclude) {
        this.excludedFunctions.push(functionToExclude);
    };
    
    this.getState = function() {
        return this.state;
    }
    
    /**
     * Attach a custom logger to the profiler. If no logger is supplied, the
     * minimal default logger is used.
     *
     * @param logger  the logger object, which must implement the standard
     *                log4j logging methods debug(), info(), warn(), error(),
     *                and fatal().
     */
    this.setLogger = function(logger) {
        if (logger) {
            this.logger = logger;
        }
        else {
            this.logger = new Profiler.DefaultLogger();
        }
    };
    
    /**
     * Sets the state of the profiler, and notifies any registered listeners of
     * a state change.
     */
    this._setState = function(newState) {
        this.state = newState;
        for (var i = 0; i < this.stateListeners.length; ++i) {
            try {
                this.stateListeners[i].handleProfilerStateUpdate(this);
            }
            catch (e) {
                this.logger.warn('Caught exception when '
                    + this.stateListeners[i]
                    + ' tried to handle a change to state ' + newState + ': '
                    + (e.message ? e.message : e));
            }
        }
    };
    
    /**
     * Creates a unique ProfileData object for a profilable function, and
     * returns its identifier.
     */
    this._addProfileDataForFunction = function(functionInfo) {
        this.profileData.push(new ProfileData(functionInfo));
        var id = this.profileData.length - 1;
        return id;
    };
    
    this._clearProfileData = function() {
        this.profileData = [];
    }

    /**
     * The function that is called as a function call is starting to be
     * profiled.
     */
    this._enterProfile = function(id, entryTime) {
        var profileData = this.profileData[id];
        profileData.callCount++;
        profileData.entryTimes.push(entryTime);
        this.profileStack.push(profileData);
    };
    
    /**
     * The function that is called when a function call has completed profiling.
     */
    this._exitProfile = function(id, exitTime) {
        var profileData = this.profileData[id];
        var entryTime = profileData.entryTimes.pop();
        var runTime = exitTime - entryTime;
        profileData.totalTime += runTime;
        
        // populate nonOwnTime upward before we lose the information
        if (this.profileStack.length > 1) {
            var callerProfileData =
                this.profileStack[this.profileStack.length-2];
            callerProfileData.nonOwnTime += runTime;
        }
        this.profileStack.pop();
    };

    /**
     * Returns a list of objects containing information about all functions
     * reachable by traversing a given object.
     *
     * @param parentObject   the object from which to traverse the object graph
     * @param variableNames  optional
     */
    this._getAllFunctions = function(parentObject, variableNames) {
        var objectQueue = [ [ parentObject, [] ] ];
        var excludedObjects =
            [ null, undefined ].concat(this.excludedObjects);
        var excludedFunctions =
            [ null, undefined ].concat(this.excludedFunctions);
        var functions = [];
        var markedObjects = [];
        var unmarkableObjects = [];
        
        queueLoop:
        while (objectQueue.length > 0) {
            // perform non-recursive, breadth-first iteration
            var queueItem = objectQueue.shift();
            var object = queueItem[0];
            var trace = queueItem[1];
            var props = [];
            
            if (variableNames && variableNames.length) {
                props = [].concat(variableNames);
                variableNames = [];
            }
            else {
                try {
                    props = keys(object);
                }
                catch (e) {
                    this.logger.debug('Caught exception when trying to enumerate '
                        + 'properties of object ' + object + ': '
                        + (e.message ? e.message : e));
                    continue;
                }
            }
            try {
                objectLoop:
                for (var i = 0; i < props.length; ++i) {
                    var prop = props[i];
                
                    // IE hack
                    if (prop == 'mimeTypes' ||
                        prop == 'clipboardData' ||
                        prop == 'Option' ||
                        prop == 'frames' ||
                        prop == 'Image') {
                        continue;
                    }
                    var childObject = object[prop];
                    
                    // no brainer
                    if (childObject == object) {
                        continue;
                    }
                    // don't include objects and functions we've already seen
                    if (childObject.markedAsAlreadySeen) {
                        continue;
                    }
                    switch (typeof(childObject)) {
                        case 'object':
                            // don't include DOM objects
                            if (isDOMObject(childObject)) {
                                this.logger.debug('Skipping DOM object: '
                                    + prop);
                                continue;
                            }
                            // don't include special IE objects
                            if (isSpecialIEObject(childObject)) {
                                this.logger.debug('Skipping special IE object: '
                                    + prop);
                                continue;
                            }
                            // don't include nsI objects
                            if (isNsIObject(childObject)) {
                                this.logger.debug('Skipping nsI object: '
                                    + prop);
                                continue;
                            }
                            // don't include objects that should have been
                            // marked, but weren't allowed to be
                            for (var j = 0; j < unmarkableObjects.length; ++j) {
                                if (childObject == unmarkableObjects[j]) {
                                    continue objectLoop;
                                }
                            }
                            // don't traverse objects that are explicitly
                            // excluded
                            for (var j = 0; j < excludedObjects.length; ++j) {
                                if (childObject == excludedObjects[j]) {
                                    continue objectLoop;
                                }
                            }
                            objectQueue.push([ childObject
                                , trace.concat([ prop ]) ]);
                            try {
                                childObject.markedAsAlreadySeen = true;
                                markedObjects.push(childObject);
                            }
                            catch (e) {
                                this.logger.debug('Could not mark object '
                                    + prop + ' as already seen: '
                                    + (e.message ? e.message : e));
                                unmarkableObjects.push(childObject);
                            }
                            break;
                        case 'function':
                            // don't include non-functions, such as RegExp
                            if (!(childObject instanceof Function)) {
                                continue;
                            }
                            // don't include native functions
                            if (isNativeCode(childObject)) {
                                this.logger.debug('Skipping native function: '
                                    + prop);
                                continue;
                            }
                            // don't include functions that are explicitly
                            // excluded
                            for (var j = 0; j < excludedFunctions.length; ++j) {
                                if (childObject == excludedFunctions[j]) {
                                    continue objectLoop;
                                }
                            }
                            functions.push(new FunctionInfo(
                                trace.concat([ prop ]), object));
                            // also traverse this object's prototype
                            if (childObject.prototype) {
                                objectQueue.push([ childObject.prototype
                                    , trace.concat([ prop, 'prototype' ]) ]);
                            }
                            childObject.markedAsAlreadySeen = true;
                            markedObjects.push(childObject);
                            break;
                    }
                }
            }
            catch (e) {
                // types of spurious exceptions we catch here:
                //
                // "Object doesn't support this action"
                // "Permission denied to get property"
                // "Permission denied to call method"
                // "Security error"
                // "InternalError: too much recursion"
                this.logger.debug('Caught exception when finding functions '
                    + 'for object ' + object + ': '
                    + (e.message ? e.message : e));
            }
        }
        // remove the marks
        for (var i = 0; i < markedObjects.length; ++i) {
            markedObjects[i].markedAsAlreadySeen = undefined;
        }
        return functions;
    };
    
    /**
     * Performs a simple check to see if a function has been decorated.
     */
    this._isDecoratedForProfiling = function(object) {
        return /_enterProfile/.test(object) && /_exitProfile/.test(object);
    };
    
    /**
     * Decorates a function to be profiled. The prototype of the decorator is
     * set to the prototype of the original function, and all expando
     * properties are preserved.
     */
    this._decorateFunction = function(functionInfo)
    {
        var profiler = this;
        var id = this._addProfileDataForFunction(functionInfo);
        var originalFunction = functionInfo.originalFunction;
        
        var decorator = function() {
            if (profiler.getState() == Profiler.STATE_RUNNING) {
                profiler._enterProfile(id, new Date());
                var retval = originalFunction.apply(this, arguments);
                profiler._exitProfile(id, new Date());
                return retval;
            }
            else {
                return originalFunction.apply(this, arguments);
            }
        };
        decorator.prototype = originalFunction.prototype;
        for (var prop in originalFunction) {
            decorator[prop] = originalFunction[prop];
        }
        functionInfo.parentObject[functionInfo.getName()] = decorator;
        
        this.decoratedFunctions.push(functionInfo);
        this.logger.debug('Decorated function '
            + functionInfo.getTraceAsString());
    };
    
    /**
     * Decorate for profiling all functions reachable by traversing the object
     * graph for a given object.
     *
     * @param parentObject   the object whose attached functions and objects
     *                       are being recursively decorated
     * @param variableNames  an optional list of specific names that key into
     *                       parentObject. If specified, the typical property
     *                       iteration will not occur for the parent. It still
     *                       will occur for child objects.
     */
    this._decorateAllFunctions = function(parentObject, variableNames) {
        var functions = this
            ._getAllFunctions(parentObject, variableNames);
        for (var i = 0; i < functions.length; ++i) {
            if (!this._isDecoratedForProfiling(functions[i])) {
                this._decorateFunction(functions[i]);
            }
        }
    };
    
    this._undecorateAllFunctions = function() {
        for (var i = 0; i < this.decoratedFunctions.length; ++i) {
            var functionInfo = this.decoratedFunctions[i];
            functionInfo.parentObject[functionInfo.getName()] =
                functionInfo.originalFunction;
            this.logger.debug('Undecorated function '
                + functionInfo.getTraceAsString());
        }
        this.decoratedFunctions = [];
    };
    
    /**
     * Performs a fast parse of javascript content and returns an object whose
     * keys are names of possible functions and objects declared within that
     * content. Use this instead of the more technically accurate Narcissus
     * parser, because Narcissus is way too slow.
     *
     * @param scriptContent  some javascript content
     */
    this._lazyParse = function(scriptContent) {
        var functionRegexp = /function\s+(\w+)/g;
        var variableRegexp = /(\w+)\s*=/g;

        var possibleNames = [];
        var matches;
        while ((matches = functionRegexp.exec(scriptContent)) != null) {
            possibleNames.push(matches[1]);
        }
        while ((matches = variableRegexp.exec(scriptContent)) != null) {
            possibleNames.push(matches[1]);
        }
        var uniqueNames = {};
        for (var i = 0; i < possibleNames.length; ++i) {
            uniqueNames[possibleNames[i]] = true;
        }
        return keys(uniqueNames).sort();
    };
    
    /**
     * Profiler object constructor.
     */
    this._init = function() {
        this.stateListeners = [];
        this.profileData = [];
        this.excludedObjects = [
            document    // the document object
            , this      // the Profiler instance
        ];
        // these MUST be excluded, otherwise very strange behavior will be
        // observed!
        this.excludedFunctions = [
            window.Profiler         // the Profiler class
            , window.ProfileData    // the ProfileData class
        ];
        
        // maintains a list of data objects for functions that have been
        // decorated for profiling
        this.decoratedFunctions = [];
        
        // the current function call profile stack. This is required in order
        // for ownTime to be calculated.
        this.profileStack = [];
        
        this.logger = new Profiler.DefaultLogger();
        
        this._setState(Profiler.STATE_NEW);
        
        this.setMode(Profiler.MODE_PROFILE_EVERYTHING);
        this.clearSelectedObjects();
    };
    
    this._init();
}

Profiler.MODE_PROFILE_EVERYTHING       = 0;
Profiler.MODE_PROFILE_SELECTED_OBJECTS = 1;

Profiler.STATE_NEW          = 0;
Profiler.STATE_INITIALIZING = 1;
Profiler.STATE_RUNNING      = 2;
Profiler.STATE_STOPPED      = 3;

Profiler.DefaultLogger = function() {
    this.debug = function() {};
    this.info  = function() {};
    this.warn  = function() {};
    this.error = function(msg) { alert(msg); };
    this.fatal = function(msg) { alert(msg); };
};



/**
 * Provides a no-nonsense way to embed a profiler with a GUI control in a page.
 * The view conveniently implements a logging interface.
 *
 * @param parentId  the id of the DOM node under which to attach the gui.
 */
function DefaultProfilerView(parentId)
{
    this.startOrStop = function() {
        if (this.startStopButton.value == 'Start') {
            this.profiler.start();
        }
        else {
            this.profiler.stop();
        }
    };
    
    this.reset = function() {
        this.profiler.reset();
    }
    
    this.showOrHideResults = function() {
        if (this.showHideResultsButton.value == 'Show Results') {
            this.updateResults();
            this.resultsTable.style.display = '';
            this.showHideResultsButton.value = 'Hide Results';
        }
        else {
            this.resultsTable.style.display = 'none';
            this.showHideResultsButton.value = 'Show Results';
        }
    };
    
    this.showOrHideLog = function() {
        if (!this.isLogShowing()) {
            this.updateLog();
            this.logList.style.display = '';
            this.showHideLogButton.value = 'Hide Log';
        }
        else {
            this.logList.style.display = 'none';
            this.showHideLogButton.value = 'Show Log';
        }
    };
    
    this.isLogShowing = function() {
        return this.logList.style.display != 'none';
    };
    
    this.updateResults = function() {
        // remove all but header row
        var resultsTbody = this.resultsTbody;
        while (resultsTbody.childNodes.length > 1) {
            resultsTbody.removeChild(resultsTbody.lastChild);
        }
        
        var profileData = this.profiler.getProfileData();
        var sortFn;
        switch(this.sortByColumn) {
            case 'Function Name':
                sortFn = function(a, b) {
                    f1 = a.functionInfo.getName();
                    f2 = b.functionInfo.getName();
                    var uc_f1 = f1.toUpperCase();
                    var uc_f2 = f2.toUpperCase();
                    if (uc_f1 > uc_f2) {
                        return 1;
                    }
                    if (uc_f1 < uc_f2) {
                        return -1;
                    }
                    // ok, discriminate by case
                    if (f1 > f2) {
                        return 1;
                    }
                    if (f1 < f2) {
                        return -1;
                    }
                    // ok, discriminate by trace
                    f1 = a.functionInfo.getTraceAsString();
                    f2 = b.functionInfo.getTraceAsString();
                    if (f1 > f2) {
                        return 1;
                    }
                    if (f1 < f2) {
                        return -1;
                    }
                    return 0;
                };
                break;
            case 'Call Count':
                sortFn = function(a, b) { return b.callCount - a.callCount; };
                break;
            case 'Total Time':
                sortFn = function(a, b) { return b.totalTime - a.totalTime; };
                break;
            case 'Non-Own Time':
                sortFn = function(a, b) { return b.nonOwnTime - a.nonOwnTime; };
                break;
            case 'Own Time':
                sortFn = function(a, b) { return b.ownTime - a.ownTime; };
                break;
            case 'Average Time':
                sortFn = function(a, b) {
                    return b.averageTime - a.averageTime;
                };
                break;
            case 'Average Own Time':
                sortFn = function(a, b) {
                    return b.averageOwnTime - a.averageOwnTime;
                };
                break;
        }
        profileData.sort(sortFn);
        
        for (var i = 0; i < profileData.length; ++i) {
            var result = profileData[i];
            var resultRow = DOMBuilder.TR([
                [   document.createTextNode(result.functionInfo.getName())
                    , DOMBuilder.BR()
                    , DOMBuilder.SPAN(result.functionInfo.getTraceAsString(),
                        { fontSize: 'xx-small' }) ]
                , result.callCount
                , decimalRound(result.totalTime, 2)
                , decimalRound(result.nonOwnTime, 2)
                , decimalRound(result.ownTime, 2)
                , decimalRound(result.averageTime, 2)
                , decimalRound(result.averageOwnTime, 2) ]
                , { border: 'solid 1px #cdc', padding: '.2em' });
            resultsTbody.appendChild(resultRow);
        }
    };
    
    /**
     * If the log level changed, the parameter to this method should be a true
     * value.
     *
     * @param logLevelChanged
     */
    this.updateLog = function(logLevelChanged) {
        var logList = this.logList
        if (this.log.length == 0) {
            while (logList.hasChildNodes()) {
                logList.removeChild(logList.firstChild);
            }
        }
        else {
            if (logLevelChanged) {
                // make sure just the right logs are showing
                var logItems = logList.childNodes;
                for (var i = 0; i < logItems.length; ++i) {
                    var logItem = logItems[i];
                    if (logItem.logLevel <= this.logLevel) {
                        logItem.style.display = '';
                    }
                    else {
                        logItem.style.display = 'none';
                    }
                }
            }
            // add new log entries with the proper display
            while (this.logCursor < this.log.length) {
                var logEntry = this.log[this.logCursor];
                var logItem = DOMBuilder.LI(
                    this._getTimestamp(logEntry[1])
                    + ' ' + DefaultProfilerView.LOGLEVEL_LABELMAP[logEntry[0]]
                    + ' - ' + logEntry[2]);
                logItem.logLevel = logEntry[0];
                if (logItem.logLevel <= this.logLevel) {
                    logItem.style.display = '';
                }
                else {
                    logItem.style.display = 'none';
                }
                logList.appendChild(logItem);
                ++this.logCursor;
            }
        }
    };
    
    this.clearLog = function() {
        this.log = [];
        this.logCursor = 0;
        this.updateLog();
    };
    
    // implement state listener interface
    this.handleProfilerStateUpdate = function(profiler) {
        switch(this.profiler.getState()) {
            case Profiler.STATE_NEW:
                this.startStopButton.value = 'Start';
                this.statusLabel.innerHTML = 'New';
                this.resetButton.disabled = true;
                this.showHideResultsButton.disabled = false;
                this.updateResults();
                break;
            case Profiler.STATE_INITIALIZING:
                this.startStopButton.value = 'Stop';
                this.statusLabel.innerHTML = 'Initializing ...';
                this.resetButton.disabled = true;
                this.showHideResultsButton.disabled = true;
                break;
            case Profiler.STATE_RUNNING:
                this.startStopButton.value = 'Stop';
                this.statusLabel.innerHTML = 'Running';
                this.resetButton.disabled = true;
                this.showHideResultsButton.disabled = false;
                break;
            case Profiler.STATE_STOPPED:
                this.startStopButton.value = 'Start';
                this.statusLabel.innerHTML = 'Stopped';
                this.resetButton.disabled = false;
                this.showHideResultsButton.disabled = false;
                this.updateResults();
                break;
        }
    };
    
    // logging interface
    
    this.debug = function(msg) {
        this.log.push([ DefaultProfilerView.LOGLEVEL_DEBUG, new Date(), msg ]);
        if (this.isLogShowing()) {
            this.updateLog();
        }
    };
    
    this.info = function(msg) {
        this.log.push([ DefaultProfilerView.LOGLEVEL_INFO, new Date(), msg ]);
        if (this.isLogShowing()) {
            this.updateLog();
        }
    };
    
    this.warn = function(msg) {
        this.log.push([ DefaultProfilerView.LOGLEVEL_WARN, new Date(), msg ]);
        if (this.isLogShowing()) {
            this.updateLog();
        }
    };
    
    this.error = function(msg) {
        this.log.push([ DefaultProfilerView.LOGLEVEL_ERROR, new Date(), msg ]);
        if (this.logLevel >= DefaultProfilerView.LOGLEVEL_ERROR) {
            if (this.isLogShowing()) {
                this.updateLog();
            }
            else {
                // force the log display to appear
                this.showOrHideLog();
            }
        }
    };
    
    this.fatal = function(msg) {
        this.log.push([ DefaultProfilerView.LOGLEVEL_FATAL, new Date(), msg ]);
        if (this.logLevel >= DefaultProfilerView.LOGLEVEL_FATAL) {
            if (this.isLogShowing()) {
                this.updateLog();
            }
            else {
                this.showOrHideLog();
            }
        }
    };
    
    this.setLogLevel = function(newLevel) {
        this.logLevel = newLevel;
        this.updateLog(true);
    };
    
    /**
     * Returns a timestamp string, given a date object.
     *
     * @param dateObject
     */
    this._getTimestamp = function(dateObject) {
        var month = dateObject.getMonth() + 1;
        var date = dateObject.getDate();
        var hours = dateObject.getHours();
        var minutes = dateObject.getMinutes();
        var seconds = dateObject.getSeconds();
        return dateObject.getFullYear()
            + '-' + (month   < 10 ? '0' + month   : month)
            + '-' + (date    < 10 ? '0' + date    : date)
            + ' ' + (hours   < 10 ? '0' + hours   : hours)
            + ':' + (minutes < 10 ? '0' + minutes : minutes)
            + ':' + (seconds < 10 ? '0' + seconds : seconds);
    };
    
    /**
     * All components of the GUI are created and updated dynamically.
     */
    this._init = function(parentId) {
        this.profiler = new Profiler();
        this.profiler.registerStateListener(this);
        this.profiler.setLogger(this);
        this.log = [];
        this.logCursor = 0;
        this.logLevel = DefaultProfilerView.LOGLEVEL_INFO;
        this.sortByColumn = 'Own Time';
        
        var self = this;
        
        var statusBar = document.createElement('span');
        statusBar.className = 'profiler-status-bar';
        var statusLabel = document.createElement('span');
        statusLabel.className = 'profiler-status-label';
        statusLabel.appendChild(document.createTextNode('New'));
        statusBar.appendChild(document.createTextNode('Status: '));
        statusBar.appendChild(statusLabel);
        
        var startStopButton = document.createElement('input');
        startStopButton.type = 'button';
        startStopButton.className = 'profiler-start-stop-button';
        startStopButton.value = 'Start';
        startStopButton.onclick = function() {
            self.startOrStop();
        };
        startStopButton.style.width = '5em';
        
        var resetButton = document.createElement('input');
        resetButton.type = 'button';
        resetButton.className = 'profiler-reset-button';
        resetButton.value = 'Reset';
        resetButton.onclick = function() {
            self.reset();
        };
        resetButton.style.width = '5em';
        resetButton.disabled = true;
        
        var showHideResultsButton = document.createElement('input');
        showHideResultsButton.type = 'button';
        showHideResultsButton.className = 'profiler-show-results-button';
        showHideResultsButton.value = 'Show Results';
        showHideResultsButton.onclick = function() {
            self.showOrHideResults();
        };
        showHideResultsButton.style.width = '8em';
        showHideResultsButton.disabled = false;
        
        var showHideLogButton = document.createElement('input');
        showHideLogButton.type = 'button';
        showHideLogButton.className = 'profiler-show-log-button';
        showHideLogButton.value = 'Show Log';
        showHideLogButton.onclick = function() {
            self.showOrHideLog();
        };
        showHideLogButton.style.width = '7em';
        
        var clearLogButton = document.createElement('input');
        clearLogButton.type = 'button';
        clearLogButton.className = 'profiler-clear-log-button';
        clearLogButton.value = 'Clear Log';
        clearLogButton.onclick = function() {
            self.clearLog();
        };
        clearLogButton.style.width = '7em';
        
        var logLevelSelect = document.createElement('select');
        logLevelSelect.className = 'profiler-log-level-select';
        logLevelSelect.id = 'theSelect';
        logLevelSelect.onchange = function() {
            self.setLogLevel(DefaultProfilerView
                .LOGLEVEL_VALUEMAP[this.value]);
        }
        var i = 0;
        for (var label in DefaultProfilerView.LOGLEVEL_VALUEMAP) {
            var logLevelOption = document.createElement('option');
            logLevelOption.value = label;
            logLevelOption.appendChild(document.createTextNode(label));
            logLevelSelect.appendChild(logLevelOption);
            // select this level by default
            if (label == 'INFO') {
                logLevelSelect.selectedIndex = i;
            }
            ++i;
        }
        
        var resultsTable = document.createElement('table');
        var resultsTbody = document.createElement('tbody');
        var resultsHeader = DOMBuilder.TR([
            'Function Name'
            , 'Call Count'
            , 'Total Time'
            , 'Non-Own Time'
            , 'Own Time'
            , 'Average Time'
            , 'Average Own Time' ]
            , { border: 'solid 1px #cdc', cursor: 'pointer' }, 'th');
        var headers = resultsHeader.childNodes;
        for (var i = 0; i < headers.length; ++i) {
            headers[i].onclick = function() {
                self.sortByColumn = this.innerText || this.textContent;
                self.updateResults();
            };
        }
        resultsTbody.appendChild(resultsHeader);
        resultsTable.appendChild(resultsTbody);
        resultsTable.style.marginTop = '.5em';
        resultsTable.style.borderCollapse = 'collapse';
        resultsTable.style.display = 'none';
        
        var logList = document.createElement('ul');
        logList.style.fontFamily = 'monospace';
        logList.style.marginTop = '.5em';
        logList.style.marginLeft = '0';
        logList.style.border = 'solid 1px #dcc';
        logList.style.padding = '.2em';
        logList.style.listStyle = 'none';
        logList.style.display = 'none';
                
        var viewBox = document.createElement('div');
        viewBox.className = 'profiler-view-box';
        viewBox.appendChild(statusBar);
        viewBox.appendChild(document.createElement('br'));
        viewBox.appendChild(startStopButton);
        viewBox.appendChild(resetButton);
        viewBox.appendChild(showHideResultsButton);
        viewBox.appendChild(showHideLogButton);
        viewBox.appendChild(clearLogButton);
        viewBox.appendChild(logLevelSelect);
        viewBox.appendChild(resultsTable);
        viewBox.appendChild(logList);
        var parentElement = document.getElementById(parentId);
        parentElement.appendChild(viewBox);
        
        // bind interface elements to this object
        this.statusBar = statusBar;
        this.statusLabel = statusLabel;
        this.startStopButton = startStopButton;
        this.resetButton = resetButton;
        this.showHideResultsButton = showHideResultsButton;
        this.logLevelSelect = logLevelSelect;
        this.showHideLogButton = showHideLogButton;
        this.clearLogButton = clearLogButton;
        this.resultsTable = resultsTable;
        this.resultsTbody = resultsTbody;
        this.logList = logList;
        
        // exclude the functions intimately involved with starting and stopping
        // the profiler, to avoid providing misleading information
        this.profiler.addExcludedFunction(this.startStopButton.onclick);
        this.profiler.addExcludedFunction(this.startOrStop);
        this.profiler.addExcludedFunction(this.handleProfilerStateUpdate);
        this.profiler.addExcludedFunction(window.DefaultProfilerView);
    };
    
    this._init(parentId);
}

// the value of less verbose (higher priority) logging levels are lower
DefaultProfilerView.LOGLEVEL_DEBUG = 4;
DefaultProfilerView.LOGLEVEL_INFO  = 3;
DefaultProfilerView.LOGLEVEL_WARN  = 2;
DefaultProfilerView.LOGLEVEL_ERROR = 1;
DefaultProfilerView.LOGLEVEL_FATAL = 0;
DefaultProfilerView.LOGLEVEL_LABELMAP = {
    4  : 'DEBUG'
    , 3: 'INFO'
    , 2: 'WARN'
    , 1: 'ERROR'
    , 0: 'FATAL'
};
DefaultProfilerView.LOGLEVEL_VALUEMAP = {
    'DEBUG'  : 4
    , 'INFO' : 3
    , 'WARN' : 2
    , 'ERROR': 1
    , 'FATAL': 0
};
























