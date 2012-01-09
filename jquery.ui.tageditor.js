(function ( $ ) {
  $.fn.autoGrowInput = function(o) {
    o = $.extend(o, {
      maxWidth: 1000,
      minWidth: 0,
      comfortZone: 70
    });

    this.filter('input:text').each(function(){
      var minWidth = o.minWidth || $(this).width(),
          val = '',
          input = $(this),
          testSubject = $('<tester/>').css({
            position: 'absolute',
            top: -9999,
            left: -9999,
            width: 'auto',
            fontSize: input.css('fontSize'),
            fontFamily: input.css('fontFamily'),
            fontWeight: input.css('fontWeight'),
            letterSpacing: input.css('letterSpacing'),
            whiteSpace: 'nowrap'
          }),
          check = function() {
            if (val === (val = input.val())) {return;}
            // Enter new content into testSubject
            var escaped = val.replace(/&/g, '&amp;').replace(/\s/g,' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            testSubject.html(escaped);
            // Calculate new width + whether to change
            var testerWidth = testSubject.width(),
                newWidth = (testerWidth + o.comfortZone) >= minWidth ? testerWidth + o.comfortZone : minWidth,
                currentWidth = input.width(),
                isValidWidthChange = (newWidth < currentWidth && newWidth >= minWidth)
                                     || (newWidth > minWidth && newWidth < o.maxWidth);
            // Animate width
            if (isValidWidthChange) {
              input.width(newWidth);
            }
          };
      $('body').append(testSubject);
      $(this).bind('keyup keydown blur update', check);
    });
    return this;
  };
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
      }).autoGrowInput();
      var markup = $('<div>', {
        id : id+'_tageditor',
        class : 'tageditor'
      }).append(tagList).append(addTagInput).click(function() {
        addTagInput.focus();
      }).insertAfter(input);

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
      
      var addTag = function(value, oid, initializing) {
        if (value != '' && value.match(/^[A-Za-z0-9 \-]*$/) && !checkDuplicate(value)) {
          var tag = tagPrototype.clone(true);
          tag.prepend(value);
          tag.data('tageditor', {value: value, oid: oid});
          tagList.append(tag);
          updateInput();
          if (!initializing) {
            markup.effect('highlight');
          }
        } else {
          if (!initializing) {
            markup.effect('highlight', {color: '#FFAAAA'});
          }
        }
        addTagInput.val('');
      };
      

      // Last found items from autocomplete request
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
        // Add when comma, or enter is typed
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
            addTag(parts[0],null,true);
          } else if (parts.length == 2) {
            addTag(parts[1],parts[0],true);
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