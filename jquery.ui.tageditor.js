(function ( $ ) {
  $.widget("ui.tageditor", {
    options: {
      autocomplete: null,
      autocomplete_options: {},
      autocomplete_only: false,
      defaultText: 'add tags'
    },
    _create: function() {
      var self = this;
      var input = this.element.hide();
      var id = input.attr('id');

      var tagList = $('<div>');
      var addTagInput = $('<input>', {
        value : '',
        placeholder : this.options.defaultText
      });
      var markup = $('<div>', {
        id : id+'_tageditor',
        class : 'tageditor'
      }).append(tagList).append(addTagInput).insertAfter(input);

      var updateInput = function() {
        var newValue = [];
        tagList.children('.tag').each(function() {
          var d = $(this).data('tageditor');
          if (d.oid) {
            newValue.push(d.oid+':'+d.value);
          } else {
            newValue.push(d.value);
          }
        });
        input.val(newValue.join(','));
      };

      var tagPrototype = $('<span>', {class: 'tag', title: 'Click to Remove'}).click(function() {
        $(this).parent().remove();
        updateInput();
      });
      
      var checkDuplicate = function(value) {
        var dup = false;
        tagList.children('.tag').each(function() {
          if(value == $(this).data('tageditor').value) {
            dup = true;
            return false;
          }
        });
        return dup;
      };
      
      var addTag = function(value, oid) {
        if (!checkDuplicate(value)) {
          var tag = tagPrototype.clone(true);
          tag.prepend(value);
          tag.data('tageditor', {value: value, oid: oid});
        tagList.append(tag);
        }
        addTagInput.val('');
        updateInput();
      };
      

      
      var lastItems = [];
      if(this.options.autocomplete) {
        this.options.autocomplete_options.source = this.options.autocomplete;
        
        addTagInput.autocomplete($.extend(this.options.autocomplete_options, {
          select: function(event,ui) {
            if(ui.item.id) {
              addTag(ui.item.value, ui.item.id);
            } else if (ui.item.value) {
              addTag(ui.item.value);
            } else {
              addTag(ui.item);
            }
            return false;
          }
        }));
        // Override menu render to get objects
        addTagInput.data('autocomplete')._renderOldMenu = addTagInput.data('autocomplete')._renderMenu;
        addTagInput.data('autocomplete')._renderMenu = function(ul, items) {
          lastItems = items;
          this._renderOldMenu(ul, items);
        };
        
      }
      if(!this.options.autocomplete_only) {
        // Check to see if it matches an autocomplete exactly
        var lookupItems = function(i) {
          var found = null;
          $.each(lastItems, function() {
            if( i == this.value ) {
              found = this;
              return false;
            }
          });
          return found;
        };
        // Add when comma or enter is typed
        addTagInput.bind('keypress', function(event) {
          if(event.which == 44 || event.which == 13) {
            event.preventDefault();
            var lookup = lookupItems(addTagInput.val());
            if(lookup) {
              addTag(lookup.value, lookup.id);
            } else {
              addTag(addTagInput.val());
            }
            addTagInput.autocomplete('close');
            return false;
          }          
        });
      }
      addTagInput.bind('keydown', function(event) {
        if(event.keyCode == 8 && $(this).val() == '') {
          event.preventDefault();
          tagList.children('.tag').last().remove();
          updateInput();
          return false;
        }
      });
      
      markup.append(addTagInput);
      
      var initializeTags = function() {
        var inputs = input.val().split(',');
        $.each(inputs, function() {
          var parts = this.split(':');
          if(parts.length == 1) {
            addTag(parts[0]);
          } else if (parts.length == 2) {
            addTag(parts[1],parts[0]);
          }
        });
        updateInput();
      };
      initializeTags();
    },
    _setOption: function( key, value ) {
      options[key] = value;
      $.Widget.prototype._setOption.apply(this, arguments);
    },
    destroy: function() {
      $.Widget.prototype.destroy.call(this);
    }
  });
})( jQuery );