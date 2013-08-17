'use strict';

var forEach = angular.forEach;

angular.module('ngTouchNav')

  //expose $navigate service inside views
  .run(function($rootScope, $navigate) {
    $rootScope.$navigate = $navigate;
  })

  .provider('$navigate', function() {

    this.$get = function($location, $timeout, $rootScope) {

      var self = this;
      this.history = [];
      this.defaultAnimation = 'animation-slide';
      this.animation = this.defaultAnimation;

      setTimeout(function() {
        self.history.push({path: $location.path(), animation: null});
      });

      this.setAnimation = function(animation, reverse) {
        if(animation) {
          if(reverse) {
            self.animation = animation + ' ng-reverse';
          } else {
            self.animation = animation;
          }
        }
        return self.animation;
      };

      this.path = function(path, animation, reverse) {
        // console.warn('$navigate.path', arguments, this.history);
        if(typeof animation === 'boolean') {
          reverse = animation;
          animation = null;
        }
        this.setAnimation(animation || this.defaultAnimation, reverse);
        $location.path(path);
        if(!reverse) {
          this.history.push({path: path, animation: animation});
        }
      };

      this.search = function(search, paramValue, animation, reverse) {
        // console.warn('$navigate.search', arguments);
        this.setAnimation(animation || this.defaultAnimation, reverse);
        $location.search(search, paramValue);
      };

      this.back = function() {
        if(this.history.length < 2) {
          return;
        }
        var animation = this.history.pop().animation;
        var item = this.history[this.history.length - 1];
        if(item.path) {
          this.path(item.path, animation, true);
        }
      };

      return this;

    };

  });
