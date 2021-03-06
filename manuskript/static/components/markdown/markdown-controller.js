(function() {
  var module = angular.module('manuskript.markdown.controller', ['manuskript.core']);

  module.controller("MarkdownController", function($scope, $sce) {

    $scope.editorOptions = {
      mode: 'markdown',
      viewportMargin: Infinity,
      onLoad: function(cm) {
        $(cm).focus();
      }
    };

    $scope.$watch('node.state', function() {
      if ($scope.node.state == 'render') {
        $scope.node.rendered = markdown.toHTML($scope.node.source.join("\n"));
        $scope.node.state = 'show';
      }
    });

    $scope.trustedHtml = function() {
      return $sce.trustAsHtml($scope.node.rendered);
    };

  });

})();