/**
 * angular-touch-nav
 * @version v0.2.3 - 2013-08-29
 * @link https://github.com/mgcrea/angular-touch-nav
 * @author Olivier Louvignes <olivier@mg-crea.com>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function (window, document, undefined) {
  'use strict';
  angular.module('ngTouchNav', [
    'ngRoute',
    'ngAnimate'
  ]);
  var jqLite = angular.element;
  angular.module('ngTouchNav').config([
    '$provide',
    function ($provide) {
      $provide.decorator('ngViewDirective', [
        '$delegate',
        '$navigate',
        '$route',
        '$anchorScroll',
        '$compile',
        '$controller',
        '$animate',
        function ($delegate, $navigate, $route, $anchorScroll, $compile, $controller, $animate) {
          var directive = $delegate[0];
          directive.compile = function (element, attr, linker) {
            var firstRenderedView = true, lastAnimation = null;
            return function (scope, $element, attr) {
              var currentScope, currentElement, onloadExp = attr.onload || '';
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
                  var newScope = scope.$new();
                  linker(newScope, function (clone) {
                    cleanupLastView();
                    clone.html(template);
                    if ($navigate.animation) {
                      lastAnimation = $navigate.animation;
                      if (!firstRenderedView) {
                        clone.addClass($navigate.animation);
                      } else {
                        setTimeout(function () {
                          firstRenderedView = false;
                          clone.addClass($navigate.animation);
                        });
                      }
                    }
                    $animate.enter(clone, null, $element);
                    var link = $compile(clone.contents()), current = $route.current;
                    currentScope = current.scope = newScope;
                    currentElement = clone;
                    if (current.controller) {
                      locals.$scope = currentScope;
                      var controller = $controller(current.controller, locals);
                      if (current.controllerAs) {
                        currentScope[current.controllerAs] = controller;
                      }
                      clone.data('$ngControllerController', controller);
                      clone.contents().data('$ngControllerController', controller);
                    }
                    link(currentScope);
                    currentScope.$emit('$viewContentLoaded');
                    currentScope.$eval(onloadExp);
                    $anchorScroll();
                  });
                } else {
                  cleanupLastView();
                }
              }
            };
          };
          return $delegate;
        }
      ]);
    }
  ]);
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
          var w3cAnimationProp = 'animation';
          var w3cTransitionProp = 'transition';
          var vendorAnimationProp = $sniffer.vendorPrefix + 'Animation';
          var vendorTransitionProp = $sniffer.vendorPrefix + 'Transition';
          var durationKey = 'Duration', delayKey = 'Delay', animationIterationCountKey = 'IterationCount', ELEMENT_NODE = 1;
          function animate(element, className, done) {
            if (!($sniffer.transitions || $sniffer.animations)) {
              done();
              return;
            } else if ([
                'ng-enter',
                'ng-leave',
                'ng-move'
              ].indexOf(className) == -1) {
              var existingDuration = 0;
              forEach(element, function (element) {
                if (element.nodeType == ELEMENT_NODE) {
                  var elementStyles = $window.getComputedStyle(element) || {};
                  existingDuration = Math.max(parseMaxTime(elementStyles[w3cTransitionProp + durationKey]), parseMaxTime(elementStyles[vendorTransitionProp + durationKey]), existingDuration);
                }
              });
              if (existingDuration > 0) {
                done();
                return;
              }
            }
            element.addClass(className);
            var duration = 0;
            forEach(element, function (element) {
              if (element.nodeType == ELEMENT_NODE) {
                var elementStyles = $window.getComputedStyle(element) || {};
                var transitionDelay = Math.max(parseMaxTime(elementStyles[w3cTransitionProp + delayKey]), parseMaxTime(elementStyles[vendorTransitionProp + delayKey]));
                var animationDelay = Math.max(parseMaxTime(elementStyles[w3cAnimationProp + delayKey]), parseMaxTime(elementStyles[vendorAnimationProp + delayKey]));
                var transitionDuration = Math.max(parseMaxTime(elementStyles[w3cTransitionProp + durationKey]), parseMaxTime(elementStyles[vendorTransitionProp + durationKey]));
                var animationDuration = Math.max(parseMaxTime(elementStyles[w3cAnimationProp + durationKey]), parseMaxTime(elementStyles[vendorAnimationProp + durationKey]));
                if (animationDuration > 0) {
                  animationDuration *= Math.max(parseInt(elementStyles[w3cAnimationProp + animationIterationCountKey]) || 0, parseInt(elementStyles[vendorAnimationProp + animationIterationCountKey]) || 0, 1);
                }
                duration = Math.max(animationDelay + animationDuration, transitionDelay + transitionDuration, duration);
              }
            });
            if (duration > 0) {
              var activeClassName = '';
              forEach(className.split(' '), function (klass, i) {
                activeClassName += (i > 0 ? ' ' : '') + klass + '-active';
              });
              $timeout(function () {
                element.addClass(activeClassName);
                $timeout(done, duration * 1000 + 50, false);
                var w3cAnimationEvent = 'animationend';
                var w3cTransitionEvent = 'transitionend';
                var vendorAnimationEvent = $sniffer.vendorPrefix.toLowerCase() + 'AnimationEnd';
                var vendorTransitionEvent = $sniffer.vendorPrefix.toLowerCase() + 'TransitionEnd';
                var events = [
                    w3cAnimationEvent,
                    vendorAnimationEvent,
                    w3cTransitionEvent,
                    vendorTransitionEvent
                  ].join(' ');
                var callback = function () {
                  console.warn('callback');
                  element.off(events, callback);
                  $timeout(done, 0, false);
                };
                element.on(events, callback);
              }, 0, false);
              return function onEnd(cancelled) {
                element.removeClass(className);
                element.removeClass(activeClassName);
                if (cancelled) {
                  done();
                }
              };
            } else {
              element.removeClass(className);
              done();
            }
            function parseMaxTime(str) {
              var total = 0, values = angular.isString(str) ? str.split(/\s*,\s*/) : [];
              forEach(values, function (value) {
                total = Math.max(parseFloat(value) || 0, total);
              });
              return total;
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
  ]);
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
}(window, document));