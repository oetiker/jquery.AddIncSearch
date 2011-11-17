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

  selectBoxHeight   height of the selectbox

  maxMultiMatch     if multiple entries match, how many should be displayed.
    
  warnMultiMatch    string to append to a list of entries cut short
                    by maxMultiMatch

  warnNoMatch       string to show in the list when no entries match

  zIndex            zIndex for the additional page elements
                    it should be higher than the index of the select boxes.

To restore the normal operation of a selectbox, just cal

 jquery("select").RemoveIncSearch();

Example Document:

 <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
   "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
 <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
 <head>
 <script type="text/javascript" src="jquery-1.3.2.min.js"></script>
 <script type="text/javascript" src="jquery.AddIncSearch.js"></script>
 <script type="text/javascript">
 jQuery(document).ready(function() {
    jQuery("select").AddIncSearch({
        maxListSize: 20,
        maxMultiMatch: 50,
        warnMultiMatch: 'top {0} matches ...',
        warnNoMatch: 'no matches ...'
    });
 });
 </script>
 </head>
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
            maxListSize: 20,
            maxMultiMatch: 50,
            warnMultiMatch: 'top {0} matches ...',
            warnNoMatch: 'no matches ...',
            selectBoxHeight: '30ex',
            zIndex: 'auto'
        }
    };
    // Private Variables and Functions
    var _ = {
        moveInputFocus: function (jq,dist) {
            var $fields = jq.parents('form').eq(0)
                .find('button:visible,input:visible,textarea:visible,select:visible')
            var index = $fields.index( jq );
            if ( index > -1
                 && index + dist < $fields.length
                 && index + dist >= 0 ) {
			     $fields.eq( index + dist ).focus();
                 return true;
            }
            else {
                 return false;
            }
        },
	reEscape: function(text) {
            return text.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
	},

        action: function(options,idx){
            
            // only active select objects with drop down capability
            if (this.nodeName != 'SELECT' || this.size > 1) {
                return this;
            }
            
            var select_tag = this;
            var $select_tag = $(select_tag);
            // do not run twice on the same select tag
            if ($select_tag.data('AICelements')){                
                return this;
            };
            var $parent = $select_tag.parent();
//            if ($parent.css("position") == "static") {
//                  $parent.css("position", "relative");
//            }
            
            var idKey = 'AIS_'+Math.floor(1e10 * Math.random()).toString(36);
            var meta_opts = options;
            
            // lets you override the options
            // inside the dom objects class property
            // requires the jQuery metadata plugin
            // <div class="hello {color: 'red'}">ddd</div>

            if ($.meta){
                meta_opts = $.extend({}, options, $select_tag.data());
            }            
            
            var $empty_opt = $('<option value="_E_M_P_T_Y_"></option>');
            $select_tag.append($empty_opt); 

            var $top_match_div = $('<div>'+meta_opts.warnMultiMatch.replace(/\{0\}/g, meta_opts.maxMultiMatch)+'</div>')
            .css({
                color: '#bbb'
            });
            var $no_match_div = $('<div>'+meta_opts.warnNoMatch+'</div>')
            .css({
                color: '#bbb'
            });                
            
            // overlay div to block events from select element
            var $blocker = $('<div/>')
            .css({
                position: 'absolute',
                width:  $select_tag.outerWidth(),
                height: $select_tag.outerHeight(),
                backgroundColor: '#FFFFFF',
                opacity: '0.01',
                filter:  'Alpha(opacity=1)'
            })
            .appendTo($parent);

            // overlay text field for searching capability
            var $input = $('<input type="text"/>')
            .hide()
            // copy selected styles to text field
            .addClass('addIncSearch')
            .css({
                position: 'absolute',
                backgroundColor: 'transparent',
                outlineStyle: 'none',
                borderColor: 'transparent',
                borderStyle: 'solid',
                borderBottomWidth: $select_tag.css('border-bottom-width'),
                borderLeftWidth: $select_tag.css('border-left-width'),
                borderRightWidth: $select_tag.css('border-right-width'),
                borderTopWidth: $select_tag.css('border-top-width'),
                marginBottom: $select_tag.css('margin-bottom'),
                marginLeft: $select_tag.css('margin-left'),
                marginRight: $select_tag.css('margin-right'),
                marginTop:  $select_tag.css('margin-top'),
                paddingBottom: $select_tag.css('padding-bottom'),
                paddingLeft: $select_tag.css('padding-left'),
                paddingRight: $select_tag.css('padding-right'),
                paddingTop: $select_tag.css('padding-top')
            })
            .width($select_tag.innerWidth())
            .height($select_tag.outerHeight())
            .appendTo($parent);

            // create a neat little drop down replacement

            var $chooser = $('<div/>')
            .addClass('AddIncSearchChooser')
            .hide()
            .css({
                position: 'absolute',
                height: meta_opts.selectBoxHeight.toString(),
                width:  $select_tag.outerWidth()-6,
                overflow: 'auto',
                borderColor:  $select_tag.css('border-color') || '#000',
                borderStyle: 'solid',
                borderWidth: '1px',
                padding: '2px',
                backgroundColor:  $select_tag.css('background-color'),
                fontFamily: $select_tag.css('font-family'),
                fontSize: $select_tag.css('font-size'),
                cursor: 'pointer',
                MozUserSelect: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                boxShadow: '3px 3px 5px #bbb',
                MozBoxShadow: '3px 3px 5px #bbb',
                WebkitBoxShadow: '3px 3px 5px #bbb'
            });
            
            $chooser.xClear = function(){
                this.xIdArr = [];
                this.xCurrentRow = null;
            };
            $chooser.xHiLite = function(row){
                if (this.xCurrentRow != null){
                    $('#' + idKey + this.xIdArr[this.xCurrentRow].toString(36)).css({
                        color: $select_tag.css('color'),
                        backgroundColor:  'transparent'
                    })
                }
                if (row >= this.xIdArr.length){
                    row = this.xIdArr.length -1;
                }
                else if (row < 0){
                    row = 0;
                }
                var $el = $('#' + idKey + this.xIdArr[row].toString(36)).css({
                    color: '#fff',
                    backgroundColor: '#444'
                })
                var el = $el.get(0);
                if (el){
                    var top = $el.position().top;
                    var scroll = $chooser.scrollTop();
                    var elheight = $el.height();                    
                    var cheight = $chooser.height()-elheight;
                    if (top >= cheight){
                        $chooser.scrollTop(scroll + top - cheight + elheight );
                    }
                    else if (top < 0){
                        $chooser.scrollTop(scroll + top);
                    }
                }
                this.xCurrentRow = row;                
            };
            $chooser.xNextRow = function(){
                if (this.xCurrentRow < this.xIdArr.length - 1){
                    this.xHiLite(this.xCurrentRow+1);
                }
            };
            $chooser.xPrevRow = function(){
                if (this.xCurrentRow > 0){
                    this.xHiLite(this.xCurrentRow-1);
                }
            };
            $chooser.xNextPage = function(){
                if (this.xCurrentRow < this.xIdArr.length - 1){
                    this.xHiLite(this.xCurrentRow+5);
                }
            };
            $chooser.xPrevPage = function(){
                if (this.xCurrentRow > 0){
                    this.xHiLite(this.xCurrentRow-5);
                }
            };

            $chooser.xClear();

            $chooser.xClickify = function(){
                for (var i=0;i<this.xIdArr.length;i++){                    
                    var id = '#' + idKey + this.xIdArr[i].toString(36);
                    (function(){  // local context to
                        var ii=i; // un-closure i as this gets executed NOW
                        $(id).click(function(){
                            $chooser.xHiLite(ii);
                            input_hide(); // forward declarations seem fine in javascript
                        })						
                    })();
                }
            };

            // get dom object of jquery $chooser
            var chooser = $chooser.get(0);
            
            // z-index handling
            var zIndex = /^\d+$/.test($select_tag.css("z-index")) ? $select_tag.css("z-index") : 1;
            // if z-index option is defined, use it instead of select box z-index
            if (meta_opts.zIndex && /^\d+$/.test(meta_opts.zIndex))
                zIndex = meta_opts.zIndex;
            $blocker.css("z-index", zIndex.toString(10));
            $input.css("z-index", (zIndex+1).toString(10));
            $chooser.css("z-index", (zIndex+1).toString(10));

            $chooser.appendTo($parent);

            // positioning
            function position_update() {
                var position = $select_tag.position();
                $chooser.css({
                    top: position.top+$select_tag.outerHeight()+2,
                    left: position.left+2
                });
                $input.css({
                    top: position.top,
                    left: position.left+2
                });
                $blocker.css({
                    top: position.top,
                    left: position.left
                });
            };

            // fix positioning on window resize
            $select_tag.resize(position_update);
            $(window).resize(position_update);

            // set initial position
            position_update();
            
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

            $chooser.click(function(e){
	        $input.focus();
                e.stopPropagation();
            });
            var last_selected;
            var search;
            var search_cache;
            var timer = null;

            // the actual searching gets done here
            // to not block input, we get called
            // with a timer
            function searcher() {
                if (search_cache == search){ // no change ...
                    timer = null;
                    return true;
                }
                $chooser.xClear();
                search_cache = search;
				search = _.reEscape(search);
                var match_id;
                var matches = 0;
                var opt_cnt = select_tag.length;
                var opt_arr = select_tag.options;
                // some regexp engines go slow when matching with
                // capturing enabled ... so lets not do that for the first
                // round
                var matcher_quick = new RegExp(search,'i');
                var matcher = new RegExp('(.*?)('+search+')(.*)','i');
                var new_opts = '';
                var cap;
				var last_match;
                for(var i=0;i<opt_cnt && matches < meta_opts.maxMultiMatch;i++){
                    if (matcher_quick.test(opt_arr[i].text)){
                        cap = matcher.exec(opt_arr[i].text)
                        matches++;
                        $chooser.xIdArr.push(i);
                        last_match = '<div id="'+idKey + i.toString(36)+'">'+cap[1]+'<span style="background-color: #8f8; color: #000;">'+cap[2]+'</span>'+cap[3]+'</div>';
						new_opts += last_match;
                        match_id = i;
                    }
                };

                if (matches == 1 && opt_cnt < meta_opts.maxListSize){
                    new_opts = '';
					$chooser.xClear();
                    for(var i=0;i<opt_cnt;i++){
                        $chooser.xIdArr.push(i);
						if (i == match_id){
							new_opts += last_match;
						}
						else {
	                        new_opts += '<div id="'+idKey + i.toString(36)+'">'+opt_arr[i].text+'</div>';
						}
                    }
                    $chooser.html(new_opts);
                    $chooser.xHiLite(match_id);
                }
                else if (matches >= 1){
                    $chooser.html(new_opts);
                    $chooser.xHiLite(0); 
                }
                else {
                    $chooser.empty();
                    $chooser.append($no_match_div);
                }
                if (matches >= meta_opts.maxMultiMatch){
                    $chooser.append($top_match_div);
                }
                $chooser.xClickify();
                timer = null;
            };
			            

            // show dropdown replacement
            function input_show(){
                last_selected = select_tag.selectedIndex;
                select_tag.selectedIndex = select_tag.length;
                search = '';
                search_cache = 'dymmy';
                if (last_selected != undefined && last_selected >= 0){                    
                    search = select_tag.options[last_selected].text;
                    $input.val(search);
                }
                $input.show();
                $input.focus();
                $input.select();
                $chooser.show();
                timer = setTimeout(searcher, 100);
            };

            // hide dropdown replacement
            function input_hide(){
                if ($chooser.xCurrentRow != null){
                    select_tag.selectedIndex = $chooser.xIdArr[$chooser.xCurrentRow]
                    $select_tag.change();
                }
                else {
                    select_tag.selectedIndex = last_selected;
                }
                $input.hide();
                $chooser.hide();
        	    $chooser.empty();
                over_blocker = false;
                over_chooser = false;
            };
            
            $blocker.click(
                function(e) {
                    // exit event on disabled select object
                    if($select_tag.attr("disabled"))
                        return false;
                    input_show();
                    e.stopPropagation();
                }
            );
            
            // trigger focus / blur
            // use namespaceing to later unbind the
            // events we added
            $select_tag.bind('focus.AIC',function(e){
   	    	e.preventDefault();
    	        input_show();
            });
            $select_tag.bind('click.AIC',function(e){
 	        e.preventDefault();
                input_show();
            });

            $input.blur(function(e) {
                if (!over_blocker && !over_chooser) {
                    input_hide();
                    return true;
                }
		return false;
		e.stopPropagation();
            });

            // trigger event keyup
            $input.keyup(function(e) {                
                // break searching while using navigation keys
                if($.inArray(e.keyCode, new Array(9, 13, 40, 38, 34, 33)) > 0)
                    return true;
                
                // set search text
                search = $.trim($input.val());
                
                // if a previous time is running, stop it
                if (timer != null)
                    clearTimeout(timer);
                
                // start new timer      
                timer = setTimeout(searcher, 100);
            });
            
            // trigger keydown event for keyboard usage
            var pg_step = chooser.size;
            
            function handleKeyDown(e) {
                switch(e.keyCode) {
                    case 9: // tab
                        input_hide();
                        _.moveInputFocus($select_tag,e.shiftKey ? -1 : 1);
                        break;
                    case 13:  //enter
                        input_hide();
                        _.moveInputFocus($select_tag,1);
                        break;
                    case 40: //down
                        $chooser.xNextRow();
                        break;
                    case 38: //up
                        $chooser.xPrevRow();
                        break;
                    case 34: //pgdown
                        $chooser.xNextPage();
                        break;
                    case 33: //pgup
                        $chooser.xPrevPage();
                        break;                    
                    default:
                        return true;
                }
                // we handled the key. stop
                // doing anything with it!
                e.stopPropagation();
                return false;
            };
            $input.keydown(handleKeyDown);

            // save the tags in case we want to  kill them later
            $select_tag.data('AICelements',[$chooser,$blocker,$input,$empty_opt]);
            return this;
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
        return this.each(function(idx){_.action.call(this,localOpts,idx)});
    };
    $.fn.RemoveIncSearch = function(){
        return this.each(function(){
            var $this = $(this);
            var helpers = $this.data('AICelements');
            if (helpers){
                for (var i=0; i < helpers.length;i++){
                    // empty first seems faster
                    helpers[i].empty().remove();
                }
                $this.removeData('AICelements');
                $this.unbind('click.AIC');
                $this.unbind('focus.AIC');
            }
        });
    };                
})(jQuery);

/* EOF */
