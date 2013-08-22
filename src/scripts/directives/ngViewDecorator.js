'use strict';

var jqLite = angular.element;

angular.module('ngTouchNav')

  .config(function($provide) {

    $provide.decorator('ngViewDirective', ['$delegate', '$navigate', '$route', '$anchorScroll', '$compile', '$controller', '$animate',
      function($delegate, $navigate, $route, $anchorScroll, $compile, $controller, $animate) {
      var directive = $delegate[0];

      var NG_VIEW_PRIORITY = directive.priority;
      var firstRenderedView = true;

      directive.compile = function(element, attr) {
        var onloadExp = attr.onload || '';

        element.html('');
        var anchor = jqLite(document.createComment(' ngView '));
        element.replaceWith(anchor);

        return function(scope) {
          var currentScope, currentElement, lastAnimation;

          scope.$on('$routeChangeSuccess', update);
          update();

          function cleanupLastView() {
            if (currentScope) {
              currentScope.$destroy();
              currentScope = null;
            }
            if(currentElement) {
              //animation hook
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
              cleanupLastView();

              currentScope = scope.$new();
              currentElement = element.clone();
              currentElement.html(template);
              //animation hook
              if($navigate.animation) {
                lastAnimation = $navigate.animation;
                if(!firstRenderedView) {
                  currentElement.addClass($navigate.animation);
                } else {
                  setTimeout(function() {
                    firstRenderedView = false;
                    currentElement.addClass($navigate.animation);
                  });
                }
              }
              $animate.enter(currentElement, null, anchor);

              var link = $compile(currentElement, false, NG_VIEW_PRIORITY - 1),
                  current = $route.current;

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

              // $anchorScroll might listen on event...
              $anchorScroll();
            } else {
              cleanupLastView();
            }
          }
        };
      };

      return $delegate;
    }]);

  });
