/*
 * jquery.jsite.js
 *
 * a tool for controlling edit functionality on the CL website
 * almost abstracted enough to be used as a lib on other sites
 *
 * DOES NOT WORK WITHOUT jquery.jtedit.js and jquery.facetview.js
 * 
 * created by Mark MacGillivray - mark@cottagelabs.com
 *
 * copyheart 2012. http://copyheart.org
 *
 */

(function($){
    $.fn.jsite = function(options) {


//------------------------------------------------------------------------------
        // READY THE DEFAULTS

        // specify the defaults - currently pushed from Flask settings
        var defaults = {}

        // and add in any overrides from the call
        $.fn.jsite.options = $.extend(defaults,options)
        var options = $.fn.jsite.options
        

//------------------------------------------------------------------------------
        // BUILD THE PAGE CONTENT SECTION
        var makepage = function() {
            var singleedit = function(event) {
                event.preventDefault()
                $('.edit_page').parent().before('<li><a class="jtedit_deleteit" style="color:red;" href="">delete this page</a></li>')
                $('.edit_page').parent().remove()
                editpage()
            }
            $('.edit_page').bind('click',singleedit)
            $('#facetview').facetview(options.facetview)
            if ( options.data && !options.data['editable'] ) {
                viewpage()
            } else if ( options.editable ) {
                if ( !options.data && options.loggedin ) {
                    var nothere = '<div class="alert alert-info"> \
                        <button class="close" data-dismiss="alert">x</button> \
                        <p><strong>There is no page here yet - create one.</strong></p> \
                        <p><strong>NOTE</strong>: creating a page does not list it in the site navigation. However, once created, you can add it using the <strong>list</strong> option above.</p> \
                        <p><strong>PLUS</strong>: a page is editable by default, which means it is displayed to anyone that can access it as editable (although only logged in users have access to the page setting buttons). Use the <strong>edit</strong> option if you want to change this to appearing as only viewable to non-logged in users whilst remaining as editable to those that are logged in, or select viewable to default to viewable for anyone (in this case, logged in users can still access the edit version from the <strong>options</strong> menu).</p> \
                        <p><strong>ALSO</strong>: pages are public by default, whether editable or not; even though they may not be listed on the navigation, anyone with the URL can access them. Once you have created your page, you can change the page to <strong>private</strong> if necessary, in which case only logged in users will be able to view it.</p>'
                    options.collaborative ? nothere += '<p>You can also share this page with others to collaboratively edit online.</p></div>' : nothere += '</div>'
                    $('.alert-messages').prepend(nothere)
                    var tid = window.location.pathname.replace(/\//g,'___')
                    tid == '___' ? tid += 'index' : ""
                    options.data = {
                        'id': tid,
                        'url': window.location.pathname,
                        'title': window.location.pathname,
                        'content': '',
                        'comments': false,
                        'embed': false,
                        'listed': false,
                        'access': true,
                        'editable': true,
                        'tags': [],
                        'search': {
                            'format':'panels',  // panels, list
                            'hidden': true,
                            'position':'top',   // top, bottom, left, right
                            'options': {}       // like facetview options
                        }
                    }
                    $('.edit_page').parent().next().remove()
                    $('.edit_page').parent().remove()
                    editpage()
                } else if ( options.data && options.data['editable'] && options.loggedin ) {
                    $('.edit_page').parent().before('<li><a class="jtedit_deleteit" style="color:red;" href="">delete this page</a></li>')
                    $('.edit_page').parent().remove()
                    editpage()
                }
            } else {
                $('.edit_page').hide()
                $('.edit_page').parent().next().hide()
            }
        }
        
        
        // VIEW A PAGE AS NORMAL
        var viewpage = function() {
            var record = options.data

            // if page content to be built by js (alt. can be built by backend first)
            if ( options.jspagecontent ) {
                $('#article').html("")    // empty the article block
                // display any embedded content
                if ( record["embed"] && record["embed"] != "undefined" ) {
                    var embed = '<div class="span12">'
                    if ( ( record["embed"].indexOf("/pub?") != -1 ) && ( record["embed"].indexOf("docs.google.com") != -1 ) ) {
                        embed += '<iframe id="embedded" src="' + record["embed"] +
                            '&amp;embedded=true" width="100%" height="1000" style="border:none;"></iframe>'
                    } else {
                        $('.content').css({"overflow":"hidden","padding":0})
                        embed += '<iframe id="embedded" src="http://docs.google.com/viewer?url=' + record["embed"] +
                            '&embedded=true" width="100%" height="1000" style="border:none;"></iframe>'
                    }
                    embed += '</div>'
                    $('#article').prepend(embed)
                }

                // display the page content
                var content = '<div class="span12">' + converter.makeHtml(record["content"]) + '</div>'
                $('#article').prepend(content)
            }
            
            if ( record["search"]["position"] == "right" ) {
                $('#facetview').appendTo('#article')
                $('#facetview').removeClass('row-fluid').addClass('span3')
                $('#article > .span12').addClass('span9').removeClass('span12')
            } else if ( record["search"]["position"] == "left" ) {
                $('#facetview').prependTo('#article')
                $('#facetview').removeClass('row-fluid').addClass('span3')
                $('#article > .span12').addClass('span9').removeClass('span12')
            } else if ( record["search"]["position"] == "bottom" ) {
                $('#facetview').insertAfter('#article')
            }
            record['search']['hidden'] ? $('#facetview').hide() : ""
            
            // show disqus
            if ( record["comments"] && options.comments ) {
                var disqus = '<div id="comments" class="container"><div class="comments"><div class="row-fluid" id="disqus_thread"></div></div></div> \
                    <script type="text/javascript"> \
                    var disqus_shortname = "' + options.comments + '"; \
                    (function() { \
                        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true; \
                        dsq.src = "http://" + disqus_shortname + ".disqus.com/embed.js"; \
                        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq); \
                    })(); \
                </script>'
                $('#main').after(disqus)
            }
        }

        
        // SHOW EDITABLE VERSION OF PAGE
        var editpage = function(event) {
            event ? event.preventDefault() : ""
            var record = options.data
        
            $('#facetview').hide()
            $('#article').html("")
                                    
            if ( record['embed'] ) {
                // show embed options
            } else {
                var editor = '<div class="row-fluid" style="margin-bottom:20px;"><div class="span12"><textarea class="tinymce jtedit_value jtedit_content" id="form_content" name="content" style="width:99%;min-height:300px;" placeholder="content. text, markdown or html will work."></textarea></div></div>'
                $('#article').append(editor)

                if ( options.richtextedit ) {
		            $('textarea.tinymce').tinymce({
			            script_url : '/static/vendor/tinymce/jscripts/tiny_mce/tiny_mce.js',
			            theme : "advanced",
			            plugins : "autolink,lists,style,layer,table,advimage,advlink,inlinepopups,media,searchreplace,contextmenu,paste,fullscreen,noneditable,nonbreaking,xhtmlxtras,advlist",
			            theme_advanced_buttons1 : "bold,italic,underline,|,justifyleft,justifycenter,justifyright,justifyfull,formatselect,fontselect,fontsizeselect,|,forecolor,backcolor,|,bullist,numlist,|,outdent,indent,blockquote,|,sub,sup,|,styleprops",
			            theme_advanced_buttons2 : "undo,redo,|,cut,copy,paste,|,search,replace,|,hr,link,unlink,anchor,image,charmap,media,table,|,insertlayer,moveforward,movebackward,absolute,|,cleanup,code,help,visualaid,fullscreen",
			            theme_advanced_toolbar_location : "top",
			            theme_advanced_toolbar_align : "left",
			            theme_advanced_statusbar_location : "bottom",
			            theme_advanced_resizing : true,

		            })
		        }
		    }

            // update with any values already present in record
            // if collaborative edit is on, get the content from etherpad
            if ( options.collaborative ) {
                $('#form_content').unbind()
                $('#form_content').pad({
                  'padId'             : record.id,
                  'host'              : 'http://pads.cottagelabs.com',
                  'baseUrl'           : '/p/',
                  'showControls'      : true,
                  'showChat'          : true,
                  'showLineNumbers'   : true,
                  'userName'          : 'unnamed',
                  'useMonospaceFont'  : false,
                  'noColors'          : false,
                  'hideQRCode'        : false,
                  'height'            : 400,
                  'border'            : 0,
                  'borderStyle'       : 'solid'
                })
                $('.content').css({'padding':0})
                $('#article').css({'margin-bottom':'-20px'})
                $('.alert').css({'margin-bottom':0})
            } else {
                $('#form_content').val(record['content'])
            }
            if ( options.loggedin ) {
                editoptions(record)
                $('#jtedit_space').jtedit({'data':options.data, 'makeform': false, /*'actionbuttons': false, 'jsonbutton': false,*/ 'delmsg':"", 'savemsg':"", "saveonupdate":true, "reloadonsave":""})
                //$('#metaopts').jtedit({'data':options.data, 'makeform': false, 'actionbuttons': false, 'jsonbutton': false, 'delmsg':"", 'savemsg':"", "saveonupdate":true, "reloadonsave":""})
            } else {
                $('.content').jtedit({'data':options.data, 'makeform': false, 'actionbuttons': false, 'jsonbutton': false, 'delmsg':"", 'savemsg':"", "saveonupdate":true, "reloadonsave":""})
            }
        }


        // EDIT OPTION BUTTON FUNCTIONS
        var editoptions = function(record) {
        
            // metadata options
            var metaopts = '<div id="metaopts" class="row-fluid"><div class="hero-unit clearfix"><button class="pagesettings close">x</button>'
            metaopts += '<div class="span5"><h2>access settings</h2>'
            metaopts += '<p><input type="checkbox" class="page_options access_page" /> anyone can access this page without login</p>'
            metaopts += '<p><input type="checkbox" class="page_options mode_page" /> display as editable by default, to anyone that can view it</p>'
            metaopts += '<p><input type="checkbox" class="page_options nav_page" /> list this page in public nav menu and search results</p>'
            metaopts += '<h2><br />page comments</h2><p><input type="checkbox" class="page_options page_comments" /> enable comments on this page</p>'
            metaopts += '<h2><br />raw metadata</h2><p>Edit the raw metadata record of this page, then save changes to it if required.</p><div id="jtedit_space"></div>'
            metaopts += '</div>'
            metaopts += '<div class="span5"><h2>search display settings</h2>'
            metaopts += '<p>when showing results, display on \
                <select class="span1 page_options search_position"><option value="top">top</option><option value="bottom">bottom</option> \
                <option value="left">left</option><option value="right">right</option></select> of the page</p> \
                <p><input type="checkbox" class="page_options hide_search" /> hide the search result panel until the search bar is used</p> \
                <p><input type="checkbox" class="page_options list_search" /> simplify search results to a list of result title links</p> \
                <p>show <input type="text" class="span1 page_options search_howmany" value="9" /> results per search result set</p> \
                <p>set a default search value of <input type="text" class="span2 page_options search_default" /> </p> \
                <p>author: <input type="text" class="span2 jtedit_value jtedit_author" /></p> \
                <p>title: <input type="text" class="span3 jtedit_value jtedit_title" /></p> \
                <p>tags: <input type="text" class="span3 page_options page_tags" /></p>'
                //<p>sort search results by <select class="span1 page_options search_sort"><option>date</option></select></p>'
            //metaopts += '<h2><br />custom css</h2><p>provide option for custom css injection</p>'
            metaopts += '</div>'
            metaopts += '</div></div>'
            $('#article').before(metaopts)
            $('#metaopts').hide()

            //$('.jtedit_deleteit').parent().before('<li><a class="pagesettings" href="">edit page settings</a></li><li><a class="pagemedia" href="">embed media</a></li>')
            $('#mainnavlist').append('<li><a class="pagesettings" href="">settings</a></li><li><a class="pagemedia" href="">media</a></li>')
            var showopts = function(event) {
                event.preventDefault()
                $('#metaopts').toggle()
            }
            var showmedia = function(event) {
                event.preventDefault()
                !$('#absolute_media_gallery').length ? $('body').media_gallery() : ""
            }
            $('.pagemedia').bind('click',showmedia)
            $('.pagesettings').bind('click',showopts)
            
            options.data['editable'] ? $('.mode_page').attr('checked',true) : ""
            options.data['accessible'] ? $('.access_page').attr('checked',true) : ""
            options.data['visible'] ? $('.nav_page').attr('checked',true) : ""
            options.data['comments'] ? $('.page_comments').attr('checked',true) : ""
            options.data['search']['hidden'] ? $('.hide_search').attr('checked',true) : ""
            options.data['search']['format'] == 'list' ? $('.list_search').attr('checked',true) : ""
            if (options.data['search']['options']['paging']) {
                options.data['search']['options']['paging']['size'] ? $('.search_howmany').val(options.data['search']['options']['paging']['size']) : ""
            }
            options.data['search']['options']['q'] ? $('.search_default').val(options.data['search']['options']['q']) : ""
            options.data['search']['position'] ? $('.search_position').val(options.data['search']['position']) : ""
            options.data['tags'] ? $('.page_tags').val(options.data['tags']) : ""

            var edits = function(event) {
                var record = $.parseJSON($('#jtedit_json').val())
                if ( $(this).hasClass('mode_page') ) {
                    $(this).attr('checked') == 'checked' ? record['editable'] = true : record['editable'] = false
                } else if ( $(this).hasClass('page_comments') ) {
                    $(this).attr('checked') == 'checked' ? record['comments'] = true : record['comments'] = false
                } else if ( $(this).hasClass('access_page') ) {
                    $(this).attr('checked') == 'checked' ? record['accessible'] = true : record['accessible'] = false
                    update_sitemap(record)
                } else if ( $(this).hasClass('nav_page') ) {
                    $(this).attr('checked') == 'checked' ? record['visible'] = true : record['visible'] = false
                    update_sitemap(record)
                } else if ( $(this).hasClass('hide_search') ) {
                    $(this).attr('checked') == 'checked' ? record['search']['hidden'] = true : record['search']['hidden'] = false
                } else if ( $(this).hasClass('list_search') ) {
                    $(this).attr('checked') ? record['search']['format'] = 'list' : record['search']['format'] = 'panels'
                } else if ( $(this).hasClass('search_position') ) {
                    record['search']['position'] = $(this).val()
                } else if ( $(this).hasClass('search_howmany') ) {
                    record['search']['options']['paging'] = {'from':0,'size':$(this).val() }
                } else if ( $(this).hasClass('search_default') ) {
                    record['search']['options']['q'] = $(this).val()
                } else if ( $(this).hasClass('page_tags') ) {
                    var tags = $(this).val().split(',')
                    record['tags'] = []
                    for ( var item in tags ) {
                        record['tags'].push($.trim(tags[item]))
                    }
                }
                $('#jtedit_json').val(JSON.stringify(record,"","    "))
                $.fn.jtedit.saveit()
            }
            $('.page_options').bind('change',edits)
        }
        
        var update_sitemap = function(record) {
            var info = {
                'listed': record['listed'],
                'access': record['access'],
                'url': window.location.pathname
            }
            var url = '/sitemap' + window.location.pathname
            $.ajax({ 
                type: 'POST', 
                url: url, 
                data: JSON.stringify(info),
                contentType: "application/json; charset=utf-8"
            })
        }


//------------------------------------------------------------------------------
        // TAG CLOUD
        var tagcloud = function(event) {
            $('.alert').remove()
            if ( $('.navbar-in-page').length ) {
                $('#topstrap').animate({height:'60px'},{duration:500})
                $('#tagcloud').animate({height:'185px'},{duration:500})
            } else {
                $('html,body').scrollTop($('#facetview').offset().top - 20)
            }
            $('#navsearch').animate({width:'400px'},{duration:500})
        }

        var detagcloud = function(event) {
            if ( $('.navbar-in-page').length ) {
                jQuery('#topstrap').animate({height:options.bannerheight},{duration:500})
                jQuery('#tagcloud').animate({height:'0px'},{duration:500})
            }
            jQuery('#navsearch').animate({width:'200px'},{duration:500})
        }

        var dotagsearch = function(event) {
            event.preventDefault()
            var tag = $(this).html()
            $('#navsearch').val(options.tagkey+':'+tag)
            $('#navsearch').trigger('keyup')
        }
        var showtags = function(data) {
            for (var term in data.facets.tagterm.terms) {
                var val = data.facets.tagterm.terms[term]["term"]
                var termlink = '<a class="tagsearch" href="?q=' + val + '">' + val + '</a> '
                $('#tagcloud > p').append(termlink)
            }
            $('.tagsearch').bind('click',dotagsearch)
        }
        var buildtagcloud = function() {
            var query = {
                "query":{
                    "match_all":{}
                },
                "facets":{
                    "tagterm":{
                        "terms":{
                            "field":options.tagkey,
                            "size":100
                        }
                    }
                }
            }
            $.ajax({
                type: "get",
                url: options.searchurl,
                data: {source: JSON.stringify(query) },
                // processData: false,
                dataType: options.datatype,
                success: showtags
            })
            jQuery('#navsearch').bind('focus',tagcloud)
            jQuery('#navsearch').bind('blur',detagcloud)
        }


//------------------------------------------------------------------------------
        // TWEETS
        var tweets = function() {
            $(".tweet").tweet({
                username: options.twitter,
                avatar_size: 48,
                count: 5,
                join_text: "auto",
                auto_join_text_default: "we said,",
                auto_join_text_ed: "we",
                auto_join_text_ing: "we were",
                auto_join_text_reply: "we replied",
                auto_join_text_url: "we read ",
                loading_text: "loading tweets..."
            })
        }


        // attach a selectall to the search bar, and ensure search is visible on search
        var selectall = function(event) {
            event.preventDefault()
            $(this).select()
        }
        var searchvis = function() {
            if ( !$('#facetview').is(':visible') ) {
                $('#close_facetview').remove()
                $('#facetview').prepend('<button id="close_facetview" class="close">close</button>')
                $('#close_facetview').css({'margin-right':'5px'})
                $('#close_facetview').unbind()
                var closefv = function(event) {
                    event.preventDefault()
                    $('#facetview').hide()
                }
                $('#close_facetview').bind('click',closefv)
                $('#facetview').show()
                $('#navsearch').trigger('keyup')
            }
        }

        // prep showdown for displays
        var converter = false
        options['jspagecontent'] ? converter = new Showdown.converter() : ""


        return this.each(function() {
            
            // make the topnav sticky on scroll
            var fromtop = $('#topnav').offset().top + 40
            $(window).scroll(function() {
		        if ( $(window).scrollTop() > fromtop && $('#topnav').hasClass('navbar-in-page') ) {
                    $('#topstrap').css({height:options.bannerheight})
                    $('#tagcloud').css({height:'0px'})
                    $('#topnav').removeClass('navbar-in-page')
                    $('#topnav').addClass('navbar-fixed-top')
                    $('#mainnavlist').parent().addClass('navbar-top-pad')
                }
                if ( $(window).scrollTop() < fromtop && $('#topnav').hasClass('navbar-fixed-top') ) {
                    $('#topnav').removeClass('navbar-fixed-top')
                    $('#mainnavlist').parent().removeClass('navbar-top-pad')
                    $('#topnav').addClass('navbar-in-page')
                }
            })

            // bind new page creation to new page button
            var newpage = function(event) {
                event.preventDefault()
                var subaddr = window.location.pathname
                subaddr.charAt(subaddr.length-1) != '/' ? subaddr += '/' : ""
                var newaddr = prompt('what / where ?',subaddr)
                newaddr.indexOf('/null') == -1 ? window.location = newaddr : ""
            }
            $('#new_page').bind('click',newpage)

            // bind search display
            $('#navsearch').bind('focus',searchvis)
            $('#navsearch').bind('mouseup',selectall)

            // setup the tag cloud functionality
            options.tagkey ? buildtagcloud() : false

            // bind the twitter display if twitter account provided
            options.twitter ? tweets() : false
            
            // get going. for now it is assumed that the record is provided in the options. but could pull from a source, similar to jtedit
            makepage()

        })

    }

    // options are declared as a function so that they can be retrieved
    // externally (which allows for saving them remotely etc)
    $.fn.jsite.options = {}

})(jQuery)

