angular.module('codemirror', []).directive('codemirror', function() {  
  
  var CODEMIRROR_EDITOR_CLASS = 'codemirror-editor';

  function loadCodeMirrorEditor(element, mode) {
    
    var editor = CodeMirror.fromTextArea($(element).find('.' + CODEMIRROR_EDITOR_CLASS)[0], {
        lineNumbers: true,
	mode: mode	
      });
    
    //var editor = ace.edit($(element).find('.' + ACE_EDITOR_CLASS)[0]);
    //editor.session.setMode("ace/mode/" + mode);
    //editor.renderer.setShowPrintMargin(false);

    return editor;
  }

  function valid(editor) {
    return (Object.keys(editor.getSession().getAnnotations()).length == 0);
  }

  return {
    restrict: 'A',
    require: '?ngModel',
    transclude: true,
    template: '<div class="transcluded" ng-transclude></div><div class="' + CODEMIRROR_EDITOR_CLASS + '"></div>',

    link: function(scope, element, attrs, ngModel) {
      var textarea = $(element).find('textarea');
      textarea.hide();                  

      var mode = attrs.mode;
      var editor = loadCodeMirrorEditor(element, mode);      
      scope.codemirror = editor;

      if (!ngModel) return; // do nothing if no ngModel

      ngModel.$render = function() {
        var value = ngModel.$viewValue || '';
        editor.setValue(value);
        textarea.val(value);	
      };
      
      editor.setOption('onChange', function() {		
	ngModel.$setViewValue(editor.getValue());	
        textarea.val(editor.getValue());
      });

      //editor.getSession().on('change', function() {
        //if (valid(editor)) {
          //scope.$apply(read);
	  
	 // ngModel.$setViewValue(editor.getValue());	
        //textarea.val(editor.getValue());
        //}
      //});

      editor.setValue(textarea.val());
            
      ngModel.$setViewValue(editor.getValue());	
      textarea.val(editor.getValue());      
    }
  }
});
