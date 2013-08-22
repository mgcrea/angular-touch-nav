/**
 * angular-touch-nav
 * @version v0.2.1 - 2013-08-22
 * @link https://github.com/mgcrea/angular-touch-nav
 * @author Olivier Louvignes <olivier@mg-crea.com>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
angular.module('ngTouchNav', [
  'ngRoute',
  'ngAnimate'
]);'use strict';
var jqLite = angular.element;
angular.module('ngTouchNav').config([
  '$provide',
  function ($provide) {
    $provide.decorator('ngViewDirective', function ($delegate, $navigate, $route, $anchorScroll, $compile, $controller, $animate) {
      var directive = $delegate[0];
      var NG_VIEW_PRIORITY = directive.priority;
      var firstRenderedView = true;
      directive.compile = function (element, attr) {
        var onloadExp = attr.onload || '';
        element.html('');
        var anchor = jqLite(document.createComment(' ngView '));
        element.replaceWith(anchor);
        return function (scope) {
          var currentScope, currentElement, lastAnimation;
          scope.$on('$routeChangeSuccess', update);
          update();
          function cleanupLastView() {
            if (currentScope) {
              currentScope.$destroy();
              currentScope = null;
            }
            if (currentElement) {
              if ($navigate.animation !== lastAnimation) {
                currentElement.removeClass(lastAnimation);
                $navigate.animation && currentElement.addClass($navigate.animation);
              }
              $animate.leave(currentElement);
              currentElement = null;
            }
          }
          function update() {
            var locals = $route.current && $route.current.locals, template = locals && locals.$template;
            if (template) {
              cleanupLastView();
              currentScope = scope.$new();
              currentElement = element.clone();
              currentElement.html(template);
              if ($navigate.animation) {
                lastAnimation = $navigate.animation;
                if (!firstRenderedView) {
                  currentElement.addClass($navigate.animation);
                } else {
                  setTimeout(function () {
                    firstRenderedView = false;
                    currentElement.addClass($navigate.animation);
                  });
                }
              }
              $animate.enter(currentElement, null, anchor);
              var link = $compile(currentElement, false, NG_VIEW_PRIORITY - 1), current = $route.current;
              if (current.controller) {
                locals.$scope = currentScope;
                var controller = $controller(current.controller, locals);
                if (current.controllerAs) {
                  currentScope[current.controllerAs] = controller;
                }
                currentElement.data('$ngControllerController', controller);
                currentElement.children().data('$ngControllerController', controller);
              }
              current.scope = currentScope;
              link(currentScope);
              currentScope.$emit('$viewContentLoaded');
              currentScope.$eval(onloadExp);
              $anchorScroll();
            } else {
              cleanupLastView();
            }
          }
        };
      };
      return $delegate;
    });
  }
]);'use strict';
var forEach = angular.forEach;
angular.module('ngTouchNav').config([
  '$animateProvider',
  function ($animateProvider) {
    $animateProvider.register('', [
      '$window',
      '$sniffer',
      '$timeout',
      function ($window, $sniffer, $timeout) {
        var noop = angular.noop;
        var forEach = angular.forEach;
        function animate(element, className, done) {
          if (!($sniffer.transitions || $sniffer.animations)) {
            done();
          } else {
            var activeClassName = '';
            $timeout(startAnimation, 1, false);
            return onEnd;
          }
          function parseMaxTime(str) {
            var total = 0, values = angular.isString(str) ? str.split(/\s*,\s*/) : [];
            forEach(values, function (value) {
              total = Math.max(parseFloat(value) || 0, total);
            });
            return total;
          }
          function startAnimation() {
            var duration = 0;
            forEach(className.split(' '), function (klass, i) {
              activeClassName += (i > 0 ? ' ' : '') + klass + '-active';
            });
            element.addClass(activeClassName);
            var w3cAnimationProp = 'animation';
            var w3cTransitionProp = 'transition';
            var vendorAnimationProp = $sniffer.vendorPrefix + 'Animation';
            var vendorTransitionProp = $sniffer.vendorPrefix + 'Transition';
            var durationKey = 'Duration', delayKey = 'Delay', animationIterationCountKey = 'IterationCount';
            var ELEMENT_NODE = 1;
            forEach(element, function (element) {
              if (element.nodeType === ELEMENT_NODE) {
                var elementStyles = $window.getComputedStyle(element) || {};
                var transitionDelay = Math.max(parseMaxTime(elementStyles[w3cTransitionProp + delayKey]), parseMaxTime(elementStyles[vendorTransitionProp + delayKey]));
                var animationDelay = Math.max(parseMaxTime(elementStyles[w3cAnimationProp + delayKey]), parseMaxTime(elementStyles[vendorAnimationProp + delayKey]));
                var transitionDuration = Math.max(parseMaxTime(elementStyles[w3cTransitionProp + durationKey]), parseMaxTime(elementStyles[vendorTransitionProp + durationKey]));
                var animationDuration = Math.max(parseMaxTime(elementStyles[w3cAnimationProp + durationKey]), parseMaxTime(elementStyles[vendorAnimationProp + durationKey]));
                if (animationDuration > 0) {
                  animationDuration *= Math.max(parseInt(elementStyles[w3cAnimationProp + animationIterationCountKey], 10) || 0, parseInt(elementStyles[vendorAnimationProp + animationIterationCountKey], 10) || 0, 1);
                }
                duration = Math.max(animationDelay + animationDuration, transitionDelay + transitionDuration, duration);
              }
            });
            if (!duration) {
              return $timeout(done, 0, false);
            }
            var w3cAnimationEvent = 'animationend';
            var w3cTransitionEvent = 'transitionend';
            var vendorAnimationEvent = $sniffer.vendorPrefix + 'AnimationEnd';
            var vendorTransitionEvent = $sniffer.vendorPrefix + 'TransitionEnd';
            var events = [
                w3cAnimationEvent,
                vendorAnimationEvent,
                w3cTransitionEvent,
                vendorTransitionEvent
              ].join(' ');
            var callback = function () {
              element.off(events, callback);
              $timeout(done, 0, false);
            };
            element.on(events, callback);
          }
          function onEnd(cancelled) {
            element.removeClass(activeClassName);
            if (cancelled) {
              done();
            }
          }
        }
        return {
          enter: function (element, done) {
            return animate(element, 'ng-enter', done);
          },
          leave: function (element, done) {
            return animate(element, 'ng-leave', done);
          },
          move: function (element, done) {
            return animate(element, 'ng-move', done);
          },
          addClass: function (element, className, done) {
            return animate(element, suffixClasses(className, '-add'), done);
          },
          removeClass: function (element, className, done) {
            return animate(element, suffixClasses(className, '-remove'), done);
          }
        };
      }
    ]);
    function suffixClasses(classes, suffix) {
      var className = '';
      classes = angular.isArray(classes) ? classes : classes.split(/\s+/);
      forEach(classes, function (klass, i) {
        if (klass && klass.length > 0) {
          className += (i > 0 ? ' ' : '') + klass + suffix;
        }
      });
      return className;
    }
  }
]);'use strict';
var forEach = angular.forEach;
angular.module('ngTouchNav').run([
  '$rootScope',
  '$navigate',
  function ($rootScope, $navigate) {
    $rootScope.$navigate = $navigate;
    $rootScope.$redraw = function performRedraw() {
      document.body.removeChild(document.body.appendChild(document.createElement('style')));
    };
  }
]).provider('$navigate', function () {
  this.$get = [
    '$location',
    '$timeout',
    '$rootScope',
    function ($location, $timeout, $rootScope) {
      var self = this;
      this.history = [];
      this.defaultAnimation = 'animation-slide';
      this.animation = this.defaultAnimation;
      setTimeout(function () {
        self.history.push({
          path: $location.path(),
          animation: null
        });
      });
      this.setAnimation = function (animation, reverse) {
        if (animation) {
          if (reverse) {
            self.animation = animation + ' ng-reverse';
          } else {
            self.animation = animation;
          }
        }
        return self.animation;
      };
      this.path = function (path, animation, reverse) {
        if (typeof animation === 'boolean') {
          reverse = animation;
          animation = null;
        }
        this.setAnimation(animation || this.defaultAnimation, reverse);
        $location.path(path);
        if (!reverse) {
          this.history.push({
            path: path,
            animation: animation
          });
        }
      };
      this.search = function (search, paramValue, animation, reverse) {
        this.setAnimation(animation || this.defaultAnimation, reverse);
        $location.search(search, paramValue);
      };
      this.back = function () {
        if (this.history.length < 2) {
          return;
        }
        var animation = this.history.pop().animation;
        var item = this.history[this.history.length - 1];
        if (item.path) {
          this.path(item.path, animation, true);
        }
      };
      return this;
    }
  ];
});