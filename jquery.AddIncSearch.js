/* ********************************************************************************
Title: Incremental Search for Select Boxes
Copyright: Tobi Oetiker <tobi@oetiker.ch>, OETIKER+PARTNER AG

$Id$

This jquery 1.3.x plugin adds incremental search to selectboxes of your choics.

If you want to 'modify' all selectboxes in your document, do the following.

 <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
 <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
 <head>
 <script type="application/javascript" src="jquery-1.3.2.min.js"></script>
 <script type="application/javascript" src="jquery.incremental_search_for_select.js"></script>
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
* **********************************************************************************/

jQuery.fn.focusNextInputField = function() {
    // this function found on 
    // http://jqueryminute.com/blog/set-focus-to-the-next-input-field-with-jquery/
    return this.each(function() {
        var fields = $(this).parents('form:eq(0),body').find('button,input,textarea,select');
        var index = fields.index( this );
        if ( index > -1 && ( index + 1 ) < fields.length ) {
            fields.eq( index + 1 ).focus();
        }
        return false;
    });
};
 
jQuery.fn.AddIncSearch = function() {
    if (jQuery.browser.msie){
        return; // do not fiddle with ie .. it is too painful
    };
    var body = jQuery("body");    
    this.each(function(){
        if (this.nodeName != 'SELECT'){ // only select objects           
            return;
        }
        if (this.size > 1){  // no select boxes
            return;
        }
        var opt_cnt = this.length;
        var orig = jQuery(this);
        var button_width = orig.outerWidth();
        var button_height = orig.outerHeight();
        var selected = jQuery(this.options[this.selectedIndex]).clone();
        var button = jQuery('<select>').append(selected);
        orig.replaceWith(button);
        button.width(button_width);
        button.height(button_height);
        var top_match = jQuery('<option>top matches ...</option>').get(0);
        var no_match = jQuery('<option>no matches ...</option>').get(0);
        top_match.disabled=true;
        no_match.disabled=true;
        var text_arr = [];
        var opt_arr = [];
        for (var i =0; i<opt_cnt;i++){
            opt_arr[i] = this.options[i];
            text_arr[i] = opt_arr[i].text.toLowerCase();
        }

        var blocker = jQuery('<div>');
        blocker.css({
            position: 'absolute',   
            width:  button.outerWidth(),
            height: button.outerHeight(),
            backgroundColor: '#ffffff',
            opacity: 0.01,
            zIndex: 1000
        });
        blocker.appendTo(body);        

        var input = jQuery('<input type="text">');
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

        var chooser = jQuery('<select size=10>');
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
                left: offset.left+2,
            });
            blocker.css({
                top: offset.top,
                left: offset.left,
            });
        };    

        jQuery(window).resize(position);
        position();

        var over_input = false;
        input.mouseover(function(){
            over_input=true;
        }).mouseout(function(){
            over_input=false;
        });

        var over_chooser = false;
        chooser.mouseover(function(){
            over_chooser=true;
        }).mouseout(function(){
            over_chooser=false;
        });

        var select_save;
        var input_show = function(){             
            select_save=selected.get(0).text
            selected.text('    ');
            if (selected.val() != ''){
                input.val(select_save);
            }
            input.show();
            chooser.show();
        };

        var input_hide = function(){
            if(selected.text() == '    '){
                selected.get(0).text = select_save;
            }
            input.hide();
        };

        
        blocker.click(function(e){
            input_show();
            input.focus();
            input.select();
            input.keyup();
            e.stopPropagation();
        });

        chooser.click(function(e){                
            e.stopPropagation();
            if (cdom.selectedIndex<0){
                return;
            }        
            input.hide();
			over_input = false;
			over_select = false;
            selected.get(0).text = cdom.options[cdom.selectedIndex].text;
            selected.get(0).value = cdom.options[cdom.selectedIndex].value;
            chooser.fadeOut(100,function(){chooser.hide()});
        });

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
            over_select = false;
            if (!over_input && !over_chooser){
                chooser.hide();
                input_hide();
            }
        });
        
        var timer = null;
        var final_call = null;
        var search_cache = 'x';
        var searcher = function(){            
            var matches = 0;
            var search = input.val().toLowerCase();
//          console.info('"'+search+'" ? "'+ search_cache +'"');
            if (search_cache == search){ // no change ... 
                timer = null;
                return;
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
            }
            if (matches == 0){
               chooser.append(no_match);
            }
            else if (matches >= 100){
               chooser.append(top_match);
            }
            else if (matches == 1 && opt_cnt < 200){
                chooser.append(opt_arr);
            }
            chooser.show();
            if (final_call){
                setTimeout(final_call,0);
                final_call = null;
            }    
            timer = null;
        };
                        
        input.keyup(function(e){                 
            if (timer == null){                
                timer = setTimeout(searcher,0);
                final_call = null;
            }
            else {
                final_call = searcher;
            };
        });

     	var pg_step = cdom.size;
        input.keypress(function(e){
//        	console.info('press '+e.keyCode);
            switch(e.keyCode){
            case 9:
                input.blur();
                chooser.blur();
                button.focusNextInputField();
                break;
            case 13:
                chooser.click();
				button.focusNextInputField();
                break;
            case 40:
                if (cdom.options.length > cdom.selectedIndex){
                    cdom.selectedIndex++;
                };
                break;
            case 34:
                if (cdom.options.length > cdom.selectedIndex + pg_step){
                    cdom.selectedIndex+=pg_step;					
                } else {
					cdom.selectedIndex = cdom.options.length-1;
				}
                break;
            case 33:
                if (cdom.selectedIndex - pg_step > 0){
                    cdom.selectedIndex-=pg_step;					
                } else {
					cdom.selectedIndex = 0;
				}
                break;
            case 38:
                if (cdom.selectedIndex > 0){
                    cdom.selectedIndex--;
                }
                break;		
            default:
                return true;                
            }
            return false;
        });
    });    
    return this;
};

