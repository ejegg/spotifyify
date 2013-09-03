function spotifyifySelection() {
    if (typeof window.getSelection != "undefined") {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            var searchQuery = sel.toString();
            var spotifyApiUrl = '//ws.spotify.com/search/1/album.json?q=' + encodeURI(searchQuery);
            var spotifyRequest = new XMLHttpRequest();
            var albumURI = "";
            var range = sel.getRangeAt(0);
            var newNode = document.createElement('a');
            spotifyRequest.onreadystatechange= function() {
                if (spotifyRequest.readyState==4) {
                    if (spotifyRequest.status==200 || window.location.href.indexOf("http")==-1) {
                        var spotifyAPIResponse = JSON.parse(spotifyRequest.response);
                        try {
                            albumURI = spotifyAPIResponse['albums'][0]['href'];
                            newNode.href = albumURI;
                            range.surroundContents(newNode);
                            location.href = albumURI;
                        }
                        catch (err) {
                            return;
                        }
                    }
                }   
            }
            spotifyRequest.open("GET", spotifyApiUrl, true);
            spotifyRequest.send(null);
        }
    } 
};

function realListFunc() {
    var recognizers = {'bbc' : { 
				 'listSelector' : 'ul.segments', 
				 'artist' : function(element) { return $('span.artist', element).text(); },
				 'track' : function(element) { return $('span.title', element).text(); } 
			       },
			'mit' : {
				 'listSelector' : 'div#playlist_data',
				 'itemSelector' : 'div.dataRow',
				 'artist' : function(element) { return $('div.dataRowBand', element).text(); },
				 'track' : function(element) { return $('div.dataRowSong', element).text(); }
				},
			'nyu' : {
				 'listSelector' : 'table#grdPlaylistEntries',
				 'itemSelector' : 'span.Site_Label_XXXSm_white',
				 'artist' : function(element) { return $('b', element).text(); },
				 'track' : function(element) { var textBits = $(element).text().split('"'); 
								return textBits.length > 1 ? textBits[1] : ""; }
				},
			'bleep' : {
				   'listSelector' : 'div#customChart',
				   'itemSelector' : 'div.cpItemFw',
				   'artist' : function(element) { return $('.action ul.itemInfo li.em a', element).attr('title'); },
				   'track' : function(element) { return $('.action ul.itemInfo li:eq(1)', element).text().trim(); }
				  }
		      };
    
    var spotifyApiUrl = '//ws.spotify.com/search/1/track.json';

    var list;
    var recognizer;

    for (source in recognizers) {
	rec = recognizers[source];
        list = $(rec.listSelector);
	if (list.length > 0) {
	    list = list[0];
            recognizer = rec;
	    break;
	}
	list = false;
    }

    if (!list) {
     	alert('Could not find playlist on page');
    	return;
    }

    var itemSelector = rec.itemSelector || 'li';
 
    var tracks = [];
    var queued = 0;

    $(itemSelector, list).each(function(idx, elem) {
	queued++;
	$(elem).css('border', '2px solid blue');
	var searchTerms = [];
	if (rec.artist) {
	    searchTerms.push('artist:' + rec.artist(elem));
	}
	if (rec.album) {
	    searchTerms.push('album:' + rec.album(elem));
	}
	if(rec.track) {
	    searchTerms.push('track:' + rec.track(elem));
	}
        var searchUrl = {'q' : searchTerms.join(' AND ')};
	$.getJSON(spotifyApiUrl, searchUrl, function(data) {
	    queued--;
	    if (data.info.num_results > 0) {
	    	tracks.push(data['tracks'][0]['href'].split(':')[2]);
	        $(elem).css('border', '2px solid green');
	    } else {

	        $(elem).css('border', '2px solid red');
	    }
		console.log(queued);
		if (queued == 0) {
		   window.setTimeout(function() {
			var playlistUrl = "spotify:trackset:" + document.title + ":" + tracks.join(',');
			document.location.href = playlistUrl;
		   }, 100); 
		}
	})
    });
};
//If the page doesn't have jquery available, load it from google before running the list parser
var spotifyifyLists = typeof($) == 'function' ? realListFunc : function() {
	var s=document.createElement("script");
	s.src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js";
	if(s.addEventListener){
	     s.addEventListener("load",realListFunc,false);
	} else if (s.readyState) {
             s.onreadystatechange = realListFunc;
        }
        document.body.appendChild(s);
};
