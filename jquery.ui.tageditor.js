(function ( $ ) {
$.widget("ui.tageditor", {
    options: {
      autocomplete: null,
      autocompleteOptions: {},
      autocompleteOnly: false,
      placeholder: 'add tags',
      singleInput: false,
      validHighlight: '#ffff99',
      invalidHighlight: '#FFAAAA'
    },
    _create: function() {
      var self = this;
      var input = this.element.hide();
      var id = input.attr('id');

      var tagList = $('<div>');
      var addTagInput = $('<input>', {
        value : '',
        placeholder : this.options.placeholder
      });
      var markup = $('<div>', {
        id : id+'_tageditor',
        class : 'tageditor'
      }).append(tagList).append(addTagInput).click(function() {
        addTagInput.focus();
      }).insertAfter(input);

      var updateInput = function(initializing) {
        if(self.options.singleInput) {
          if(tagList.children('.tag').length >= 1) {
            addTagInput.attr('placeholder','');
          } else {
            addTagInput.attr('placeholder',self.options.placeholder);
          }
        }
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
        if(!initializing) {
          input.change();
        }
      };

      var tagPrototype = $('<span>', {class: 'tag', title: 'Click to Remove'}).click(function() {
        $(this).remove();
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
      
      var checkSingleInput = function() {
        if(!self.options.singleInput) return true;
        if(tagList.children('.tag').length >= 1) {
          return false;
        }
        return true;
      }
      
      var addTag = function(value, oid, initializing) {
        if(value) value = value.trim();
        if(oid) oid = oid.trim();
        if(value != '' && value.match(/^[A-Za-z0-9 \-]*$/) && !checkDuplicate(value) && checkSingleInput()) {
          var tag = tagPrototype.clone(true);
          tag.prepend(value);
          tag.data('tageditor', {value: value, oid: oid});
          tagList.append(tag);
          updateInput(initializing);
          if (!initializing && self.options.validHighlight) {
            markup.effect('highlight', {color: self.options.validHighlight} );
          }
        } else {
          if (!initializing && self.options.validHighlight) {
            markup.effect('highlight', {color: self.options.invalidHighlight});
          }
        }
        addTagInput.val('');
      };
      

      // Last found items from autocomplete request
      var lastItems = [];
      var autocompleteOpen = false;
      if(this.options.autocomplete) {
        this.options.autocompleteOptions.source = this.options.autocomplete;
        
        addTagInput.autocomplete($.extend(this.options.autocompleteOptions, {
          select: function(event,ui) {
            if(ui.item.id) {
              addTag(ui.item.value, ui.item.id);
            } else if (ui.item.value) {
              addTag(ui.item.value);
            } else {
              addTag(ui.item);
            }
            return false;
          },
          open: function() {
            autocompleteOpen = true;
          },
          close: function() {
            autocompleteOpen = false;
          }
        }));
        // Override menu render to get objects
        addTagInput.data('autocomplete')._renderOldMenu = addTagInput.data('autocomplete')._renderMenu;
        addTagInput.data('autocomplete')._renderMenu = function(ul, items) {
          lastItems = items;
          this._renderOldMenu(ul, items);
        };
        
      }
      if(this.options.autocompleteOnly) {
        // Select the first autocompleted item on comma or enter
        addTagInput.bind('keypress', function(event) {
          if(event.which == 44 || event.which == 13) {
            if(autocompleteOpen && lastItems.length > 0) {
              event.preventDefault();
              addTag(lastItems[0].value,lastItems[0].id);
              addTagInput.autocomplete('close');
              return false;
            }
          }
        });
      } else {
        // Check to see if it matches an autocomplete exactly
        var lookupItems = function(i) {
          var found = null;
          i = i.toLowerCase();
          $.each(lastItems, function() {
            if( i == this.value.toLowerCase() ) {
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
      // Backspace deletion
      addTagInput.bind('keydown', function(event) {
        if(event.keyCode == 8 && $(this).val() == '') {
          event.preventDefault();
          tagList.children('.tag').last().remove();
          updateInput();
          return false;
        }
        // Ignore all keys for singleInput if already has input
        // Except tab key to go to the next box
        if(self.options.singleInput && tagList.children('.tag').length >= 1
          && event.keyCode != 9) {
          event.preventDefault();
          return false;
        }
      });
      
      markup.append(addTagInput);
      addTagInput.autoGrowInput();
      
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

  $.fn.autoGrowInput = function(o) {
    o = $.extend(o, {
      maxWidth: 1000,
      minWidth: 0,
      comfortZone: 70
    });
    
    this.filter('input:text').each(function(){
      var val = '',
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
          });
      $('body').append(testSubject);
      var getMinWidth = function() {
            testSubject.html(input.attr('placeholder'));
            return Math.max(o.minWidth || 0, 
                            input.width(),
                            testSubject.width()+o.comfortZone);
          },
          minWidth = getMinWidth(),
          check = function() {
            val = input.val();
            // Enter new content into testSubject
            var escaped = val.replace(/&/g, '&amp;').replace(/\s/g,' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            testSubject.html(escaped);
            // Calculate new width + whether to change
            var testerWidth = testSubject.width(),
                newWidth = (testerWidth + o.comfortZone) >= minWidth ? testerWidth + o.comfortZone : minWidth,
                currentWidth = input.width(),
                isValidWidthChange = (newWidth <= o.maxWidth);
            if (isValidWidthChange) {
              input.width(newWidth);
            }
          };
      $(this).bind('keyup keydown blur update', check);
      check();
    });
    return this;
  };
})( jQuery );