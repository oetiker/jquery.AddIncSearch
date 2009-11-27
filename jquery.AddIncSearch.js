/* **************************************************************************
Title: Incremental Search for Select Boxes
Copyright: Tobi Oetiker <tobi@oetiker.ch>, OETIKER+PARTNER AG
Contributions from: Haggi <hagman@gmx.de>

$Id$

This jquery 1.3.x plugin adds incremental search to selectboxes of
your choics.

If you want to 'modify' selectboxes in your document, do the
following.

The behaviour of the widget can be tuned with the following options:

  maxListSize       if the total number of entries in the selectbox are
                    less than maxListSize, show them all

  maxMultiMatch     if multiple entries match, how many should be displayed.
    
  warnMultiMatch    string to append to a list of entries cut short
                    by maxMultiMatch

  warnNoMatch       string to show in the list when no entries match

  zIndex            zIndex for the additional page elements
                    it should be higher than the index of the select boxes.

 <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
   "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
 <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
 <head>
 <script type="text/javascript" src="jquery-1.3.2.min.js"></script>
 <script type="text/javascript" src="jquery.AddIncSearch.js"></script>
 <script type="text/javascript">
 jQuery(document).ready(function() {
    jQuery("select").AddIncSearch({
        maxListSize: 200,
        maxMultiMatch: 100,
        warnMultiMatch: 'top {0} matches ...',
        warnNoMatch: 'no matches ...'
    });
 });
 </script>
 <body>
 <form>
   <select>
     <option value="1">Hello</option>
     <option value="2">You</option>
   </select>
 </form>
 </body>
 </html>

License:

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
* *******************************************************************/
(function($) {
    // setup a namespace for us
    var nsp = 'AddIncSearch';

    $[nsp] = {
        // let the user override the default
        // $.pluginPattern.defaultOptions.optA = false
        defaultOptions: {
            maxListSize: 200,
            maxMultiMatch: 100,
            warnMultiMatch: 'top {0} matches ...',
            warnNoMatch: 'no matches ...',
            zIndex: 'auto'
        }
    };

    // Private Variables and Functions
    var _ = {
        moveInputFocus: function (jq,dist) {
            var fields = jq.parents('form,body').eq(0)
                .find('button,input[type!=hidden],textarea,select');
            var index = fields.index( jq );
            if ( index > -1
                 && index + dist < fields.length
                 && index + dist >= 0 ) {
                 fields.eq( index + dist ).focus();
                 return true;
            }
            else {
                 return false;
            }
        },

        action: function(options){
            
            // only active select objects with drop down capability
            if (this.nodeName != 'SELECT' || this.size > 1) {
                return this;
            }

            var $this = $(this);
            var $parent = $this.parent();
            var meta_opts = options;
            
            // lets you override the options
            // inside the dom objects class property
            // requires the jQuery metadata plugin
            // <div class="hello {color: 'red'}">ddd</div>
            if ($.meta){
                meta_opts = $.extend({}, options, $this.data());
            }

            var text_arr = [];
            var opt_arr = [];
            var opt_cnt = this.length;
            var selectedIndex = this.selectedIndex; 
            for (var i=0; i<opt_cnt;i++){
                opt_arr[i] = this.options[i];
                text_arr[i] = opt_arr[i].text.toLowerCase();
            }
            
            var $selected = $(this.options[selectedIndex]).clone();
            
            // fix size of the list to whatever it was 'before'
            $this.width($this.outerWidth());
            $this.height($this.outerHeight());
            
            $this.empty().append($selected);
            
            // 
            var $top_match = $('<option>'+meta_opts.warnMultiMatch.replace(/\{0\}/g, meta_opts.maxMultiMatch)+'</option>').get(0);
            var $no_match = $('<option>'+meta_opts.warnNoMatch+'</option>').get(0);
            
            $top_match.disabled = true;
            $no_math.disabled = true;
            
            // overlay div to block events of select element
            var $blocker = $('<div/>');
            $blocker.css({
                position: 'absolute',
                width:  $this.outerWidth(),
                height: $this.outerHeight()
                /*
                ,backgroundColor: '#FFFFFF'
                ,opacity: 0.41
                */
            });
            $blocker.appendTo($parent);

            // overlay text field for searching capability
            var $input = $('<input type="text"/>');
            $input.hide();
            $input.appendTo($parent);
            $input.width($this.outerWidth() - 22);
            $input.height($this.outerHeight());
            $input.css({
                position: 'absolute',
                borderLeftWidth: $this.css('border-left-width'),
                paddingLeft: $this.css('padding-left'),
                borderTopWidth: $this.css('border-top-width'),
                paddingTop: $this.css('padding-top'),
                borderRightWidth: $this.css('border-right-width'),
                paddingRight: $this.css('padding-right'),
                borderBottomWidth: $this.css('border-bottom-width'),
                paddingBottom: $this.css('padding-bottom'),
                padding: 0,
                margin: 0,
                borderStyle: 'solid',
                borderColor: 'transparent',
                backgroundColor: 'transparent',
                outlineStyle: 'none',
            });
            
            // drop down replacement
            var chooserSize = Math.min(opt_cnt, 20);
            var $chooser = $('<select size="' + chooserSize + '"/>')
            $chooser.hide();
            $chooser.css({
                position: 'absolute',
                width:  $this.outerWidth()
            });
            
            // default entries depends on selectedIndex
            // of the source select object and maxMultiMatch count
            var mc = Math.floor(meta_opts.maxMultiMatch / 2);
            var st = Math.max(0, (selectedIndex - mc));
            var len = Math.min(opt_arr.length, (selectedIndex + mc));
            var si = selectedIndex == 0 ? selectedIndex : (len - selectedIndex);
            for (var i=st; i < len; i++) {
                $chooser.append(opt_arr[i]);
            }
            if(opt_arr.length > meta_opts.maxMultiMatch) {
                $chooser.append($top_match);
            }
                        
            // get dom object of jquery $chooser
            var cdom = $chooser.get(0);
            
            // set default selected index
            cdom.selectedIndex = si;
                        
            // z-index handling
            var zIndex = /^\d+$/.test($this.css("z-index")) ? $this.css("z-index") : 1;
            // if z-index option is defined, use it instead of select box z-index
            if (meta_opts.zIndex && /^\d+$/.test(meta_opts.zIndex))
                zIndex = meta_opts.zIndex;
            $blocker.css("z-index", zIndex.toString(10));
            $input.css("z-index", (zIndex+1).toString(10));
            $chooser.css("z-index", (zIndex+1).toString(10));

            $chooser.appendTo($parent);

            // positioning
            var position = function () {
                var offset = $this.offset();
                $chooser.css({
                    top: offset.top+$this.outerHeight(),
                    left: offset.left
                });
                $input.css({
                    top: offset.top,
                    left: offset.left+2
                });
                $blocker.css({
                    top: offset.top,
                    left: offset.left
                });
            };
            // fix positioning on window resize
            $this.resize(position);
            $(window).resize(position);

            // set initial position
            position();
            
            // track mouse movement
            var over_blocker = false;
            $blocker.mouseover(function(){
                over_blocker = true;
            });
            $blocker.mouseout(function(){
                over_blocker = false;
            });
            var over_chooser = false;
            $chooser.mouseover(function(){
                over_chooser = true;
            });
            $chooser.mouseout(function(){
                over_chooser = false;
            });

            // show dropdown replacement
            function input_show(){
                $selected.remove();
                if ($selected.val() != ''){
                    $input.val($selected.text());
                }
                $input.show();
                $chooser.show();
            };

            // hide dropdown replacement
            function input_hide(){
                $this.append($selected);
                $this.change();
                $input.hide();
                $chooser.hide();
            };
            
            // toggle click event on blocker div
            $blocker.toggle(
                function(e) {
                    // exit event on disabled select object
                    if($this.attr("disabled")) 
                        return false;
                    input_show();
                    $input.focus();
                    $input.select();
                    e.stopPropagation();
                },
                function(e) {
                    input_hide();
                    e.stopPropagation();
                }
            );
            
            // add click event on chooser
            $chooser.click(function(e) {
                e.stopPropagation();
                if (cdom.selectedIndex < 0)
                    return;
                sync_select();
                $blocker.click();
            });

            // trigger focus / blur
            $this.focus(function(){
                $blocker.click();
            });
            $chooser.focus(function(){
                over_chooser = true;
            });
            $input.blur(function() {
                if (!over_blocker && !over_chooser) {
                    $blocker.click();
                }
            });

            var timer = null;
            var search_cache;
            var search;

            // the actual searching gets done here
            // to not block input, we get called
            // with a timer
            function searcher() {
                var matches = 0;
                if (search_cache == search){ // no change ...
                    timer = null;
                    return true;
                }

                search_cache = search;
                $chooser.hide();
                $chooser.empty();
                var match_id;
                for(var i=0;i<opt_cnt && matches < meta_opts.maxMultiMatch;i++){
                    if(search == '' || text_arr[i].indexOf(search,0) >= 0){
                        matches++;
                        $chooser.append(opt_arr[i]);
                        match_id = i;
                    }
                };
                if (matches >= 1){
                    cdom.selectedIndex = 0;
                    $selected.val(cdom.options[0].value);
                    $selected.text(cdom.options[0].text);
                }
                if (matches == 0){
                    $chooser.append($no_math);
                }
                else if (matches == 1 && opt_cnt < meta_opts.maxListSize){
                    $chooser.append(opt_arr);
                    cdom.selectedIndex = match_id;
                }
                else if (matches >= meta_opts.maxMultiMatch){
                    $chooser.append($top_match);
                }
                $chooser.show();
                
                timer = null;
            };
            
            // trigger event keyup
            $input.keyup(function(e) {
                
                // break searching while using navigation keys
                if($.inArray(e.keyCode, new Array(9, 13, 40, 38, 34, 33)) > 0)
                    return true;
                
                // set search text
                search = $.trim($input.val().toLowerCase());
                
                // if a previous time is running, stop it
                if (timer != null)
                    clearTimeout(timer);
                
                // start new timer      
                timer = setTimeout(searcher, 0);
            });
            
            // synchronize selected item on dropdown replacement and source select object
            function sync_select(){
                $selected = $(cdom.options[cdom.selectedIndex]).clone();
            };

            // trigger keydown event for keyboard usage
            var pg_step = cdom.size;
            $input.keydown(function(e) {
                switch(e.keyCode) {
                    case 9:
                        $input.blur();
                        $chooser.blur();
                        _.moveInputFocus($this,e.shiftKey ? -1 : 1);
                        break;
                    case 13:  //enter
                        $input.blur();
                        $chooser.blur();
                        _.moveInputFocus($this,1);
                        break;
                    case 40: //down
                        if (cdom.options.length > cdom.selectedIndex){
                            cdom.selectedIndex++;
                            sync_select();
                        };
                        break;
                    case 38: //up
                        if (cdom.selectedIndex > 0){
                            cdom.selectedIndex--;
                            sync_select();
                        }
                        break;
                    case 34: //pgdown
                        if (cdom.options.length > cdom.selectedIndex + pg_step){
                            cdom.selectedIndex+=pg_step;
                        } else {
                            cdom.selectedIndex = cdom.options.length-1;
                        }
                        sync_select();
                        break;
                    case 33: //pgup
                        if (cdom.selectedIndex - pg_step > 0){
                            cdom.selectedIndex-=pg_step;
                        } else {
                            cdom.selectedIndex = 0;
                        }
                        sync_select();
                        break;
                    default:
                        return true;
                }
                // we handled the key. stop
                // doing anything with it!
                return false;
            });

            return;
        }
    };

    $.fn[nsp] = function(options) {
        if ($.browser.msie){
            var bvers = (parseInt($.browser.version));
            if (bvers < 7) {
                return this; // do not use with ie6, does not work
            }
        }
        var localOpts = $.extend(
            {}, // start with an empty map
            $[nsp].defaultOptions, // add defaults
            options // add options
        );
        // take care to pass on the context. without the call
        // action would be running in the _ context
        return this.each(function(){_.action.call(this,localOpts)});
    };

})(jQuery);

/* EOF */
