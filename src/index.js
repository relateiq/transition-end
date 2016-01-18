var arrayToTrueMap = require('array-to-true-map');

/*
 * Usages:
 *
 *  transitionEnd(element, propertyName, transitionEndCallback)
 *      -element: (Element) on which the transition will occur
 *      -transitionEndCallback: (Function) callback function to be called if:
 *                                  1. element does not have a non-zero transition-duration for the transition-property from propertyName
 *                                  2. transitionEnd event is fired on element for each transition-property from propertyName
 *                                      -calls transitionEndCallback with an array of the transitionend event objects
 *      -propertyName: (String) comma or space separated list of the transition-properties for which to call the transitionEndCallback
 *      -removeListenerAfterTransition: (boolean) remove the transitionend event listener after all transition properties events have fired
 *
 *  transitionEnd(element, propertyNameToTransitionEndCallback)
 *      -element: (Element) on which the transition will occur
 *      -propertyNameToTransitionEndCallback: (Object) A map where the keys are a comma or space separated list of the transition-properties
 *                      and the values are callback functions to be called if:
 *                                  1. element does not have a non-zero transition-duration for the transition-properties in the key
 *                                  2. transitionEnd event is fired on element for each transition-property in the key
 *                                      -calls transitionEndCallback with an array of the transitionend event objects
 *      -removeListenerAfterTransition: (boolean) remove the transitionend event listener after all transition properties events have fired
 */

module.exports = function () {
    var elem = null,
        propertyName = '',
        removeListenerAfterTransition = false,
        transitionEndCallback,
        propToCallback;

    Array.prototype.slice.call(arguments).forEach(function (arg) {
        if (arg instanceof Element) {
            elem = arg;
        } else if (typeof arg === 'object') {
            propToCallback = arg;
        } else if (typeof arg === 'string') {
            propertyName = arg;
        } else if (typeof arg === 'function') {
            transitionEndCallback = arg;
        } else if (typeof arg === 'boolean') {
            removeListenerAfterTransition = arg;
        }
    });

    if (!elem) {
        throw new Error('transition-end requires an element as an argument');
    } else if (propToCallback) {
        processPropToCallback(elem, propToCallback, removeListenerAfterTransition);
    } else if (transitionEndCallback) {
        maybeBindTransitionEnd(elem, parseTransitionPropertiesMap(propertyName), transitionEndCallback, removeListenerAfterTransition);
    } else {
        throw new Error('Invalid arguments for transition-end');
    }
};

function processPropToCallback(elem, propToCallback, removeListenerAfterTransition) {
    Object.keys(propToCallback).forEach(function (propertyName) {
        maybeBindTransitionEnd(elem, parseTransitionPropertiesMap(propertyName), propToCallback[propertyName], removeListenerAfterTransition);
    });
}

function maybeBindTransitionEnd(elem, transitionProperties, transitionEndCallback, removeListenerAfterTransition) {
    if (typeof transitionEndCallback === 'function') {
        if (hasTransition(elem, transitionProperties)) {
            var events = [];

            function onTransitionEnd(e) {
                if (e.target === elem && (transitionProperties[e.propertyName] || transitionProperties.all)) {
                    events.push(e);

                    if (hasEventsForAllProperties(events, transitionProperties)) {
                        if (removeListenerAfterTransition) {
                            elem.removeEventListener('transitionend', onTransitionEnd);
                            elem.removeEventListener('webkitTransitionEnd', onTransitionEnd);
                        }

                        transitionEndCallback(events);

                        //create new object reference for events array because it's passed by reference to the callback function
                        events = [];
                    }
                }
            }

            elem.addEventListener('transitionend', onTransitionEnd);
            elem.addEventListener('webkitTransitionEnd', onTransitionEnd);
        } else {
            transitionEndCallback();
        }
    }
}

function hasEventsForAllProperties(storedEvents, transitionProperties) {
    if (transitionProperties.all) {
        return true;
    }

    var storedEventPropertyNameMap = {};

    storedEvents.forEach(function (e) {
        storedEventPropertyNameMap[e.propertyName] = true;
    });

    return Object.keys(transitionProperties).every(function (propertyName) {
        return storedEventPropertyNameMap[propertyName];
    });
}

function parseTransitionProperties(str) {
    if (str) {
        return str.trim().split(/[ ,]+/);
    } else {
        return ['all'];
    }
}

function parseTransitionPropertiesMap(str) {
    return arrayToTrueMap(parseTransitionProperties(str));
}

function hasTransition(elem, validPropsMap) {
    var computedStyle = window.getComputedStyle(elem);
    var duration = parseFloat(computedStyle.transitionDuration || computedStyle.webkitTransitionDuration);

    if (duration > 0) {
        var actualProps = parseTransitionProperties(computedStyle.transitionProperty || computedStyle.webkitTransitionProperty);

        if (actualProps.indexOf('all') >= 0) {
            return true;
        }

        return !actualProps.every(function (aProp) {
            return !validPropsMap[aProp];
        });
    }

    return false;
}