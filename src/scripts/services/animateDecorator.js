'use strict';

var forEach = angular.forEach;

angular.module('ngTouchNav')

  .config(function($animateProvider) {

    $animateProvider.register('', ['$window','$sniffer', '$timeout', function($window, $sniffer, $timeout) {
      var noop = angular.noop;
      var forEach = angular.forEach;
      function animate(element, className, done) {
        if (!($sniffer.transitions || $sniffer.animations)) {
          done();
        } else {
          var activeClassName = '';
          $timeout(startAnimation, 1, false);

          //this acts as the cancellation function in case
          //a new animation is triggered while another animation
          //is still going on (otherwise the active className
          //would still hang around until the timer is complete).
          return onEnd;
        }

        function parseMaxTime(str) {
          var total = 0, values = angular.isString(str) ? str.split(/\s*,\s*/) : [];
          forEach(values, function(value) {
            total = Math.max(parseFloat(value) || 0, total);
          });
          return total;
        }

        function startAnimation() {
          var duration = 0;
          forEach(className.split(' '), function(klass, i) {
            activeClassName += (i > 0 ? ' ' : '') + klass + '-active';
          });

          element.addClass(activeClassName);

          //one day all browsers will have these properties
          var w3cAnimationProp = 'animation';
          var w3cTransitionProp = 'transition';

          //but some still use vendor-prefixed styles
          var vendorAnimationProp = $sniffer.vendorPrefix + 'Animation';
          var vendorTransitionProp = $sniffer.vendorPrefix + 'Transition';

          var durationKey = 'Duration',
              delayKey = 'Delay',
              animationIterationCountKey = 'IterationCount';

          //we want all the styles defined before and after
          var ELEMENT_NODE = 1;
          forEach(element, function(element) {
            if (element.nodeType === ELEMENT_NODE) {
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
                animationDuration *= Math.max(parseInt(elementStyles[w3cAnimationProp    + animationIterationCountKey], 10) || 0,
                                              parseInt(elementStyles[vendorAnimationProp + animationIterationCountKey], 10) || 0,
                                              1);
              }

              duration = Math.max(animationDelay  + animationDuration,
                                  transitionDelay + transitionDuration,
                                  duration);
            }
          });

          if(!duration) {
            return $timeout(done, 0, false);
          }

          //listen for animation events instead of parsing
          //computed styles for a correctly synced animation

          //one day all browsers will have these events
          var w3cAnimationEvent = 'animationend';
          var w3cTransitionEvent = 'transitionend';

          //but some still use vendor-prefixed events
          var vendorAnimationEvent = $sniffer.vendorPrefix.toLowerCase() + 'AnimationEnd';
          var vendorTransitionEvent = $sniffer.vendorPrefix.toLowerCase() + 'TransitionEnd';

          var events = [w3cAnimationEvent, vendorAnimationEvent, w3cTransitionEvent, vendorTransitionEvent].join(' ');
          var callback = function() {
            element.off(events, callback);
            $timeout(done, 0, false);
          };
          element.on(events, callback);

        }

        //this will automatically be called by $animate so
        //there is no need to attach this internally to the
        //timeout done method
        function onEnd(cancelled) {
          element.removeClass(activeClassName);

          //only when the animation is cancelled is the done()
          //function not called for this animation therefore
          //this must be also called
          if(cancelled) {
            done();
          }
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

  // .config(function($provide) {

  //   $provide.decorator('$animate', function($delegate, $window, $sniffer, $timeout) {

  //     function animate(element, className, done) {
  //       if (!($sniffer.transitions || $sniffer.animations)) {
  //         done();
  //       } else {
  //         var activeClassName = '';
  //         $timeout(startAnimation, 1, false);

  //         //this acts as the cancellation function in case
  //         //a new animation is triggered while another animation
  //         //is still going on (otherwise the active className
  //         //would still hang around until the timer is complete).
  //         return onEnd;
  //       }

  //       function startAnimation() {
  //         var duration = 0;
  //         forEach(className.split(' '), function(klass, i) {
  //           activeClassName += (i > 0 ? ' ' : '') + klass + '-active';
  //         });

  //         element.addClass(activeClassName);

  //         //one day all browsers will have these properties
  //         var w3cAnimationEvent = 'animationend';
  //         var w3cTransitionEvent = 'transitionend';

  //         //but some still use vendor-prefixed styles
  //         var vendorAnimationEvent = $sniffer.vendorPrefix + 'AnimationEnd';
  //         var vendorTransitionEvent = $sniffer.vendorPrefix + 'TransitionEnd';

  //         //listen for animation events instead of parsing
  //         //computed styles for a correctly synced animation
  //         var events = [w3cAnimationEvent, vendorAnimationEvent, w3cTransitionEvent, vendorTransitionEvent].join(' ');
  //         var callback = function() {
  //           $timeout(done, 0, false);
  //           element.off(events, callback);
  //         };
  //         element.on(events, callback);

  //       }

  //       //this will automatically be called by $animate so
  //       //there is no need to attach this internally to the
  //       //timeout done method
  //       function onEnd(cancelled) {
  //         element.removeClass(activeClassName);

  //         //only when the animation is cancelled is the done()
  //         //function not called for this animation therefore
  //         //this must be also called
  //         if(cancelled) {
  //           done();
  //         }
  //       }
  //     }

  //     $delegate.enter = function(element, done) {
  //       return animate(element, 'ng-enter', done);
  //     };
  //     $delegate.leave = function(element, done) {
  //       return animate(element, 'ng-leave', done);
  //     };
  //     $delegate.move = function(element, done) {
  //       return animate(element, 'ng-move', done);
  //     };
  //     $delegate.addClass = function(element, className, done) {
  //       return animate(element, suffixClasses(className, '-add'), done);
  //     };
  //     $delegate.removeClass = function(element, className, done) {
  //       return animate(element, suffixClasses(className, '-remove'), done);
  //     };

  //     return $delegate;
  //   });

  //   function suffixClasses(classes, suffix) {
  //     var className = '';
  //     classes = angular.isArray(classes) ? classes : classes.split(/\s+/);
  //     forEach(classes, function(klass, i) {
  //       if(klass && klass.length > 0) {
  //         className += (i > 0 ? ' ' : '') + klass + suffix;
  //       }
  //     });
  //     return className;
  //   }

  // });
