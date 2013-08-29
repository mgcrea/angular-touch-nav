'use strict';

var forEach = angular.forEach;

angular.module('ngTouchNav')

  .config(function($animateProvider) {

    $animateProvider.register('', ['$window','$sniffer', '$timeout', function($window, $sniffer, $timeout) {
      var noop = angular.noop;
      var forEach = angular.forEach;

      //one day all browsers will have these properties
      var w3cAnimationProp = 'animation';
      var w3cTransitionProp = 'transition';

      //but some still use vendor-prefixed styles
      var vendorAnimationProp = $sniffer.vendorPrefix + 'Animation';
      var vendorTransitionProp = $sniffer.vendorPrefix + 'Transition';

      var durationKey = 'Duration',
          delayKey = 'Delay',
          animationIterationCountKey = 'IterationCount',
          ELEMENT_NODE = 1;

      function animate(element, className, done) {
        if (!($sniffer.transitions || $sniffer.animations)) {
          done();
          return;
        }
        else if(['ng-enter','ng-leave','ng-move'].indexOf(className) == -1) {
          var existingDuration = 0;
          forEach(element, function(element) {
            if (element.nodeType == ELEMENT_NODE) {
              var elementStyles = $window.getComputedStyle(element) || {};
              existingDuration = Math.max(parseMaxTime(elementStyles[w3cTransitionProp + durationKey]),
                                          parseMaxTime(elementStyles[vendorTransitionProp + durationKey]),
                                          existingDuration);
            }
          });
          if(existingDuration > 0) {
            done();
            return;
          }
        }

        element.addClass(className);

        //we want all the styles defined before and after
        var duration = 0;
        forEach(element, function(element) {
          if (element.nodeType == ELEMENT_NODE) {
            var elementStyles = $window.getComputedStyle(element) || {};

            var transitionDelay     = Math.max(parseMaxTime(elementStyles[w3cTransitionProp     + delayKey]),
                                               parseMaxTime(elementStyles[vendorTransitionProp  + delayKey]));

            var animationDelay      = Math.max(parseMaxTime(elementStyles[w3cAnimationProp      + delayKey]),
                                               parseMaxTime(elementStyles[vendorAnimationProp   + delayKey]));

            var transitionDuration  = Math.max(parseMaxTime(elementStyles[w3cTransitionProp     + durationKey]),
                                               parseMaxTime(elementStyles[vendorTransitionProp  + durationKey]));

            var animationDuration   = Math.max(parseMaxTime(elementStyles[w3cAnimationProp      + durationKey]),
                                               parseMaxTime(elementStyles[vendorAnimationProp   + durationKey]));

            if(animationDuration > 0) {
              animationDuration *= Math.max(parseInt(elementStyles[w3cAnimationProp   + animationIterationCountKey]) || 0,
                                           parseInt(elementStyles[vendorAnimationProp + animationIterationCountKey]) || 0,
                                           1);
            }

            duration = Math.max(animationDelay  + animationDuration,
                                transitionDelay + transitionDuration,
                                duration);
          }
        });

        /* there is no point in performing a reflow if the animation
           timeout is empty (this would cause a flicker bug normally
           in the page */
        if(duration > 0) {
          var activeClassName = '';
          forEach(className.split(' '), function(klass, i) {
            activeClassName += (i > 0 ? ' ' : '') + klass + '-active';
          });

          $timeout(function() {
            element.addClass(activeClassName);

            //if the end events don't fire, run the callback 50ms later anyway
            $timeout(done, duration * 1000 + 50, false);

            /* listen for animation events instead of parsing
               computed styles for a correctly synced animation */

            //one day all browsers will have these events
            var w3cAnimationEvent = 'animationend';
            var w3cTransitionEvent = 'transitionend';

            //but some still use vendor-prefixed events
            var vendorAnimationEvent = $sniffer.vendorPrefix.toLowerCase() + 'AnimationEnd';
            var vendorTransitionEvent = $sniffer.vendorPrefix.toLowerCase() + 'TransitionEnd';

            var events = [w3cAnimationEvent, vendorAnimationEvent, w3cTransitionEvent, vendorTransitionEvent].join(' ');
            var callback = function() {
              console.warn('callback');
              element.off(events, callback);
              $timeout(done, 0, false);
            };
            element.on(events, callback);

          },0,false);

          //this will automatically be called by $animate so
          //there is no need to attach this internally to the
          //timeout done method
          return function onEnd(cancelled) {
            element.removeClass(className);
            element.removeClass(activeClassName);

            //only when the animation is cancelled is the done()
            //function not called for this animation therefore
            //this must be also called
            if(cancelled) {
              done();
            }
          };
        }
        else {
          element.removeClass(className);
          done();
        }

        function parseMaxTime(str) {
          var total = 0, values = angular.isString(str) ? str.split(/\s*,\s*/) : [];
          forEach(values, function(value) {
            total = Math.max(parseFloat(value) || 0, total);
          });
          return total;
        }
      }

      return {
        enter : function(element, done) {
          return animate(element, 'ng-enter', done);
        },
        leave : function(element, done) {
          return animate(element, 'ng-leave', done);
        },
        move : function(element, done) {
          return animate(element, 'ng-move', done);
        },
        addClass : function(element, className, done) {
          return animate(element, suffixClasses(className, '-add'), done);
        },
        removeClass : function(element, className, done) {
          return animate(element, suffixClasses(className, '-remove'), done);
        }
      };

    }]);

    function suffixClasses(classes, suffix) {
      var className = '';
      classes = angular.isArray(classes) ? classes : classes.split(/\s+/);
      forEach(classes, function(klass, i) {
        if(klass && klass.length > 0) {
          className += (i > 0 ? ' ' : '') + klass + suffix;
        }
      });
      return className;
    }

  });
