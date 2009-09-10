/* **************************************************************************
Title: Incremental Search for Select Boxes
Copyright: Tobi Oetiker <tobi@oetiker.ch>, OETIKER+PARTNER AG

$Id$

This jquery 1.3.x plugin adds incremental search to selectboxes of
your choics.

If you want to 'modify' all selectboxes in your document, do the
following.

 <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
   "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
 <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
 <head>
 <script type="application/javascript" src="jquery-1.3.2.min.js"></script>
 <script type="application/javascript" src="jquery.AddIncSearch.js"></script>
 <script type="application/javascript">
 jQuery(document).ready(function() {
    jQuery("select").AddIncSearch();
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

    // Private Variables and Functions
    var _ = {
        moveInputFocus:  function (jq,dist) {
            var fields = jq.parents('form:eq(0),body')
                .find('button,input,textarea,select');
            var index = fields.index( this );
            if ( index > -1
                 &&  index + dist  < fields.length
                 && index + dist >= 0 ) {
                     fields.eq( index + dist ).focus();
                 }
            return false;
        },
        action: function(){
            var body = $('body');
            if (this.nodeName != 'SELECT'){ // only select objects
                return this;
            }
            if (this.size > 1){  // no select boxes
                return this;
            }
            var opt_cnt = this.length;
            var $this = $(this);
            var button_width = $this.outerWidth();
            var button_height = $this.outerHeight();
            var selected = $(this.options[this.selectedIndex]).clone();
            var button = $('<select>').append(selected);

		    // copy original attributes
		    var myattr = ['name','id','class','style'];
		    for (var at=0;at<4;at++){
                var val = $this.attr(myattr[at]);
			    $this.removeAttr(myattr[at]);
			    if (val != undefined){
				    button.attr(myattr[at],val);
			    }
		    }
            $this.replaceWith(button);
            button.width(button_width);
            button.height(button_height);
            var top_match = $('<option>top matches ...</option>').get(0);
            var no_match = $('<option>no matches ...</option>').get(0);
            top_match.disabled=true;
            no_match.disabled=true;
            var text_arr = [];
            var opt_arr = [];
            for (var i =0; i<opt_cnt;i++){
                opt_arr[i] = this.options[i];
                text_arr[i] = opt_arr[i].text.toLowerCase();
            }

            var blocker = $('<div>');
            blocker.css({
                position: 'absolute',
                width:  button.outerWidth(),
                height: button.outerHeight(),
                backgroundColor: '#ffffff',
                opacity: 0.01,
                zIndex: 1000
            });
            blocker.appendTo(body);

            var input = $('<input type="text">');
            input.hide();
            input.appendTo(body);

            input.width(button.outerWidth());
            input.height(button.outerHeight());
            input.css({
                position: 'absolute',
                borderLeftWidth: button.css('border-left-width'),
                paddingLeft: button.css('padding-left'),
                borderTopWidth: button.css('border-top-width'),
                paddingTop: button.css('padding-top'),
                borderRightWidth: button.css('border-right-width'),
                paddingRight: button.css('padding-right'),
                borderBottomWidth: button.css('border-bottom-width'),
                paddingBottom: button.css('padding-bottom'),
                padding: 0,
                margin: 0,
                borderStyle: 'solid',
                borderColor: 'transparent',
                backgroundColor: 'transparent',
                outlineStyle: 'none',
                zIndex: 1001
            });

            var chooser = $('<select size=10>');
            var cdom = chooser.get(0);
            chooser.css({
                position: 'absolute',
                width:  button.outerWidth(),
                zIndex: 1001
            });
            chooser.hide();
            chooser.appendTo(body);

            var position = function (){
                var offset = button.offset();
                chooser.css({
                    top: offset.top+button.outerHeight(),
                    left: offset.left
                });
                input.css({
                    top: offset.top,
                    left: offset.left+2
                });
                blocker.css({
                    top: offset.top,
                    left: offset.left
                });
            };
            // fix positioning on window resize
            button.resize(position);
            $(window).resize(position);

            // set initial position
            position();

            var over_input = false;
            input.mouseover(function(){
                over_input=true;
            });
            input.mouseout(function(){
                over_input=false;
            });

            var over_chooser = false;
            chooser.mouseover(function(){
                over_chooser=true;
            });
            chooser.mouseout(function(){
                over_chooser=false;
            });


            function input_show(){
                selected.remove();
                if (selected.val() != ''){
                    input.val(selected.text());
                }
                input.show();
                chooser.show();
            };

            function input_hide(){
                button.append(selected);
                input.hide();
                chooser.hide();
            };

            function blocker_click(e){
                input_show();
                input.focus();
                input.select();
                input.keyup();
                e.stopPropagation();
            };

            blocker.click(blocker_click);

            function chooser_click(e){
                e.stopPropagation();
                if (cdom.selectedIndex<0){
                    return;
                }
                selected.get(0).text = cdom.options[cdom.selectedIndex].text;
                selected.get(0).value = cdom.options[cdom.selectedIndex].value;
                selected.parent().change();
                input_hide();
            };

            chooser.click(chooser_click);

            button.focus(function(){
                blocker.click();
            });

            input.focus(function(){
                over_input = true;
            });

            chooser.focus(function(){
                over_chooser = true;
            });

            input.blur(function(){
                over_input = false;
                if (!over_input && !over_chooser){
                    chooser.hide();
                    input_hide();
                }
            });
            chooser.blur(function(){
                over_chooser = false;
                if (!over_input && !over_chooser){
                    chooser.hide();
                    input_hide();
                }
            });

            var timer = null;
            var final_call = null;
            var search_cache = 'x';

            // the actual searching gets done here
            // to not block input, we get called
            // with a timer
            function searcher(){
                var matches = 0;
                var search = input.val().toLowerCase();

                if (search_cache == search){ // no change ...
                    timer = null;
                    return true;
                }

                search_cache = search;
                chooser.hide();
                chooser.empty();
                for(var i=0;i<opt_cnt && matches < 100;i++){
                    if(search == '' || text_arr[i].indexOf(search,0) >= 0){
                        matches++;
                        chooser.append(opt_arr[i]);
                    }
                };
                if (matches >= 1){
                    cdom.selectedIndex = 0;
                    selected.val(cdom.options[cdom.selectedIndex].value);
                    selected.text(cdom.options[cdom.selectedIndex].text);
                }
                if (matches == 0){
                    chooser.append(no_match);
                }
                else if (matches == 1 && opt_cnt < 200){
                    chooser.append(opt_arr);
                }
                else if (matches >= 100){
                    chooser.append(top_match);
                }
                chooser.show();
                // if we were running during the previous
                // keystroke do another run to make sure
                // we got it all                
                if (final_call){
                    setTimeout(final_call,0);
                    final_call = null;
                }
                timer = null;
            };

            function keyup_handler(e){
                // if no timer is running, start one
                // to call the searcher function
                if (timer == null){
                    timer = setTimeout(searcher,0);
                    final_call = null;
                }
                else {
                    // if a timer is running
                    // make sure to call searcher once again
                    // after the timer is done
                    final_call = searcher;
                };
            };

            input.keyup(keyup_handler);

            function sync_select(){
                selected.val(cdom.options[cdom.selectedIndex].value);
                selected.text(cdom.options[cdom.selectedIndex].text);
            };

            var pg_step = cdom.size;
            function keydown_handler(e){
                switch(e.keyCode){
                case 9:
                    input.blur();
                    chooser.blur();
                    _.moveInputFocus(button,e.shiftKey ? -1 : 1);
                    break;
                case 13:  //enter
                    input.blur();
                    chooser.blur();
                    _.moveInputFocus(button,1);
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
                    return;
                }
                return;
            };
            input.keydown(keydown_handler);
            return;
        },
    };

    $.fn[nsp] = function() {
        if ($.browser.mmsie){
            return this; // do not fiddle with ie .. it is too painful
        };
        return this.each(_.action);
    };

})(jQuery);

/* EOF */
