'use strict';

var jqLite = angular.element;

angular.module('ngTouchNav')

  .config(function($provide) {

    $provide.decorator('ngViewDirective', ['$delegate', '$navigate', '$route', '$anchorScroll', '$compile', '$controller', '$animate',
      function($delegate, $navigate, $route, $anchorScroll, $compile, $controller, $animate) {
      var directive = $delegate[0];

      directive.compile = function(element, attr, linker) {

        var firstRenderedView = true,
            lastAnimation = null;

        return function(scope, $element, attr) {
          var currentScope,
              currentElement,
              onloadExp = attr.onload || '';

          scope.$on('$routeChangeSuccess', update);
          update();

          function cleanupLastView() {
            if (currentScope) {
              currentScope.$destroy();
              currentScope = null;
            }
            if(currentElement) {
              //$navigate hook
              if($navigate.animation !== lastAnimation) {
                currentElement.removeClass(lastAnimation);
                $navigate.animation && currentElement.addClass($navigate.animation);
              }
              $animate.leave(currentElement);
              currentElement = null;
            }
          }

          function update() {
            var locals = $route.current && $route.current.locals,
                template = locals && locals.$template;

            if (template) {
              var newScope = scope.$new();
              linker(newScope, function(clone) {
                cleanupLastView();

                clone.html(template);
                //$navigate hook
                if($navigate.animation) {
                  lastAnimation = $navigate.animation;
                  if(!firstRenderedView) {
                    clone.addClass($navigate.animation);
                  } else {
                    setTimeout(function() {
                      firstRenderedView = false;
                      clone.addClass($navigate.animation);
                    });
                  }
                }
                $animate.enter(clone, null, $element);

                var link = $compile(clone.contents()),
                    current = $route.current;

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

                // $anchorScroll might listen on event...
                $anchorScroll();
              });
            } else {
              cleanupLastView();
            }
          }
        }
      };

      return $delegate;

    }]);

  });
