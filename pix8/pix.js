var pix = Pix = {
	exts: ['jpg', 'jpeg', 'gif', 'png', 'JPG', 'GIF', 'PNG', 'JPGEG'], //extensions of image files
	thumbH: 200,
	drag: false,
	def: 'pix8',

	tid: 449,

	api: '2.pix8.co:25286/',
	//api: 'localhost:25286/',

	// address to make thumbnails
	thumber: 'http://io.cx/thumb/',

	// height for each carousel depending how many are in view
	heights: {
		1: [100],
		2: [70,30],
		3: [50,30,20],
		4: [45,28,17,10],
		//5: [42,26,16,10,6],
		//6: [40,25,15,10,6,4]
	},

	phi: function(a, b){
		var s = [a, b];
		while(s.reduce(function(pv, cv) { return pv + cv; }, 0)<100){
			s.push(parseInt(s.slice(-1)) + parseInt(s.slice(-2, -1)))
		};

		return s;
	},

	// already loaded carousels
	carousels: [],

	// jQuery DOM items
	$items: {},

	// items already loaded from database
	items: {},

	// builds required element for carousel
	build: function(d){
		if(typeof d == 'string')
			d = {src: d};

		if(d.file && !d.src)
			d.src = Cfg.files+d.file

		var url = d.src;
		var t = this,
			$thumb = $(document.createElement('span'));

		$thumb.data(d);

		if(d.src){
			var video = pix.parseVideoURL(d.src),
				vid = video.provider;
		}

		if(video && video.provider == 'youtube'){
			var thumb = 'http://img.youtube.com/vi/'+video.id+'/sddefault.jpg';

			var frame = document.createElement("iframe");
				frame.src = 'http://www.youtube.com/embed/'+video.id;
			$thumb.addClass('youtube').append(frame);
			$thumb.append("<div class='iframe-cover'></div>");
		}
		else
		// iframe from ggif website
		if(url && url.indexOf('ggif.co')+1){
			var p = url.replace('http://', '').split(/[\/]+/);
			//var thumb = 'http://'+p[0]+'/'+p[1]+'/'+p[1]+'.gif';

			var frame = document.createElement("iframe");
			frame.onload = function(){
				var $carousel = $thumb.parent();
				if($carousel.length){
					var carousel = $carousel[0].carousel;
					carousel.resize($thumb);
				}
			}
			frame.onerror = function(){
				$thumb.parent().children('span[href="'+url+'"]').remove();
				var $carousel = $thumb.parent();
				if($carousel.length)
					$carousel[0].expand();
				
				pix.cleanTargets();
			}
				//frame.width = h;
				//frame.height = h;
				frame.src = url;
			$thumb.addClass('ggif').append(frame);
			$thumb.append("<div class='iframe-cover'></div>");
		}else{
			var image = new Image;
			image.onload = function(){
				var $thumbs = $thumb.parent().children('span[href="'+url+'"]');
				$thumbs.css('background-image', '');
				
				var $carousel = $thumb.parent();
				if($carousel.length){
					var carousel = $carousel[0].carousel;
					carousel.resize($thumb);
				}
			}
			image.onerror = function(){
				var $thumbs = $thumb.parent().children('span[href="'+url+'"]');

				/*
				if(image.src.indexOf(Local.api)+1)
					return $thumbs.children('img').attr('src', thumb || url);
				*/

				$thumbs.remove();

				var $carousel = $thumb.parent();

				pix.cleanTargets();
			}

			image.src = url;

			image.alt = thumb || url;

			$thumb.append(image);
		}

		$thumb.attr({
			href: d.href || url,
			name: 'item'+d.id
		});

		$thumb.addClass('thumb');

		//$thumb.css({'background-image': "url("+(thumb/* || Local.isReady()?'':(Pix.thumber+url)*/)+")"});

		if(d.text)
			pix.appendText(d.text, $thumb);
		
		$("<div class='n'></div>").appendTo($thumb).hide();

		pix.$items[d.id] = $thumb;

		return $thumb;
	},

	// send request to socket or to background app if its chrome extension
	send: function(m, cb){
		if(typeof ws != "undefined" && ws instanceof WS)
			ws.send(m, cb);
		else
		if(chrome && chrome.runtime)
			chrome.runtime.sendMessage({cmd: 'ws', d: m}, cb);
		else
			console.error('No way to interact with server');

	},

	// put text over thumbnail
	appendText: function(text, $thumb){
		var $article = $thumb.children('article');
		if(!$article.length)
			$article = $('<article></article>').prependTo($thumb);

		$article.text(text);

		return $article;
	},


	files: [],
	listFiles: function(cb){
		var t = this;
		chrome.runtime.sendMessage({cmd: 'files'}, function(r){
			t.files = r.files || [];
			cb(r.files);
		});
	},

	gImages: 'https://www.googleapis.com/customsearch/v1?key=AIzaSyDE7m50ILI18LCswZZ93W5KyFgtnASmkhg&&cx=005276605350744041336:wifcwjx3hiw&searchType=image&q=',
	searchGoogle: function(q, cb){
		$.getJSON(pix.gImages+q, function(r){
			var images  = [];
			if(r && r.items)
				r.items.forEach(function(item){
					if(item.link)
						images.push(item.link);
				});

			if(images.length)
				cb(images);
		})
	},

	// to fix dubmedia drag&drop bug
	cleanTargets: function(){
		var targets = $.event.special.drop.targets;
		for(var i = targets.length-1; i--;){
			if(targets[i] && !targets[i].parentElement) targets.splice(i, 1);
		}
	},

	// remove thumbnails from all carousels according to url
	cleanByUrl: function(url){
		$("#carousels span[href='"+url+"']").remove();
	},

	anim: {
		easeOutExpo: function(currentIteration, startValue, changeInValue, totalIterations){
			return changeInValue * (-Math.pow(2, -10 * currentIteration / totalIterations) + 1) + startValue;
		}
	},

	// give an URL and return direct address to that video iframe
	parseVideoURL: function(url){
		if(typeof url !== 'string') return;
	 	function getParm(url, base){
		      var re = new RegExp("(\\?|&)" + base + "\\=([^&]*)(&|$)");
		      var matches = url.match(re);
		      if (matches) {
		          return(matches[2]);
		      } else {
		          return("");
		      }
		  }

		  var retVal = {};
		  var matches;
		  var success = false;

		  if(url.match('http(s)?://(www.)?youtube|youtu\.be') ){
		    if (url.match('embed')) { retVal.id = url.split(/embed\//)[1].split('"')[0]; }
		      else { retVal.id = url.split(/v\/|v=|youtu\.be\//)[1].split(/[?&]/)[0]; }
		      retVal.provider = "youtube";
		      var videoUrl = 'https://www.youtube.com/embed/' + retVal.id + '?rel=0';
		      success = true;
		  } else if (matches = url.match(/vimeo.com\/(\d+)/)) {
		      retVal.provider = "vimeo";
		      retVal.id = matches[1];
		      var videoUrl = 'http://player.vimeo.com/video/' + retVal.id;
		      success = true;
		  }

		 return retVal;
	},

	parseURL: function(url){
		var qs = parseQS(decodeURIComponent(url));
		if(qs && qs.imgurl) 
			url = qs.imgurl;

		return url;
	},

	checkVisible: function(){
		pix.visible = $('#carousels > .carousel:visible').length;
	},

	checkPath: function(hash){
		return hash = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase() || '';
	},

	hash: function(){
		return location.hash.replace('#','').replace(/^\/|\/$/g, '');
	},

	loadDepictions: function(search){
		Pix.send({
			cmd: 'load',
			filter: {
				type: 'public',
				path: { $regex: (search || ''), $options: 'i' }
			},
			sort: {
				updated: -1
			},
			collection: 'views'
		},
		function(r){
			var $list = $('#depictions').empty();
			UI.side('#depictions');

			(r.items || []).forEach(function(item){
				var $item = $("<a href='#"+item.path+"'>"+item.path+"</a>");
				$item.data(item);

				$list.append($item);
			});
		});
	},

	loadView: function(filter, cb){
		if(!filter)
			filter = {path: document.location.href}
		else
		if(typeof filter == 'object'){}
		else
		if(typeof filter == 'string'){
			this.tag = filter;
			filter = {path: this.tag};
		}

		filter.gid = User.id;
		filter.type = 'view';

		Pix.send({
			cmd: 'get',
			filter: filter,
			collection: Cfg.collection
		},
		function(r){
			if(r.item){
				var view = r.item;

				var newIds = [];
				view.items.forEach(function(id){
					if(!Pix.items[id])
						newIds.push(id);
				});

				if(newIds.length)
					Pix.send({
						cmd: 'load',
						filter: {
							id: {$in: newIds},
							//path: "console",
							//type: "public"
						},
						collection: Cfg.collection
					}, function(r){
						(r.items || []).forEach(function(item){
							Pix.items[item.id] = item;
						});

						cb(view);
					});
				else
					cb(view);
			}
		});
	},

	streams: function(){
		var streams = [];
		$('#streams > .stream').each(function(){
			streams.push(this.stream);
		});
		return streams;
	},

	onLoad: function(){
		if(pix.authData)
			pix.onAuth(pix.authData);
		else
			pix.loadView();
	},

	loaded: [],

	defaultView: {
		id: -1,
		items: [],
		carousels: [
			{items:[], rate: 4, num: 2},
			{items:[], rate: 3, num: 4},
			{items:[], rate: 2, num: 8},
			{items:[], rate: 1, num: 16}
		]
	},

	unusedIds: function(){
		var ids = [];
		for(var id in pix.items){
			if(!$('#carousels span[name=item'+id+']').length){
		    	ids.push(parseInt(id));
			}
		};
		return ids;
	},

	onAuth: function(auth){
		if(!auth) return;

		var name = auth.username || auth.name || '';
		if(auth.twitter){
			name = auth.twitter.displayName;
			$('#acc-img').css('background-image', 'url('+auth.twitter.profileImageURL+')');
		}

		pix.auth = auth;

		$('#acc').show();
		$('#acc-name').text(name);
		$('#auth').hide();

		var $v = $("#my-stream > .stream-views > a[name='"+pix.auth.username+"']");
		if($v.length) $v.click();
	},

	makeMyFirst: function(id){
		var username = $('#acc-name').text();
		if(!username || typeof id != 'number') return;

		Pix.send({
			cmd: 'get',
			filter: {
				path: pix.path,
				username: username
			},
			collection: 'views'
		}, function(r){
			console.log(r.item);
			if(r && r.item){
				Pix.send({
					cmd: 'makeFirst',
					idView: r.item.id,
					idItem: id
				});
			}
		});
	},

	resize: function(newH){
		return;
		var newH = Math.min(Math.max(30, newH || Pix.$pic.height()), 800);

		var h = 0;
		Pix.$pic.children('.carousel:not(:last)').each(function(){
			h += $(this).height();
		});

		var carousel_last = Pix.$pic.children('.carousel').last()[0].carousel;
		carousel_last.$t.height(newH - h);
		carousel_last.resize();

		$('#pic').height(newH);

		if(!carousel_last.$t.height())
			carousel_last.$t.remove();
	},

	buildSwitch: function(){
		var $switch = $("<div class='switch'>"+
			"<input class='switch-hash' name='hash' value='hashTag'/>"+
		"</div>");

		return $switch;
	},

	$fixed: $(),
	collectFixed: function(){
		var $fixed = Pix.$fixed = $('*').filter(function(){
			var $el = $(this);
			var position = $el.css('position');
			var ok = ((
					(position === 'absolute' && !Pix.isRelative($el)) ||
					position === 'fixed' 
				) &&
				!isNaN(parseInt($el.css('top')))
			);
			if(ok) $el.data('_pix8-top', parseInt($el.css('top')));
			return ok;
		});

		Pix.marginBody = parseInt($('body').css('margin-top')) || 0;
	},

	isRelative: function($el){
		var y = false;
		$el.parents().each(function(){
			if(['relative', 'fixed', 'absolute'].indexOf($(this).css('position'))+1)
				y = true;
		});

		return y;
	},

	leaveGap: function(px){
		Pix.$fixed.each(function(){
			var $el = $(this);
			$el.css('top', $el.data('_pix8-top') + px);
		});

		$('body').css('margin-top', Pix.marginBody + px);
	},

	restoreGap: function(){
		if(isNaN(Pix.marginBody)) return;

		Pix.$fixed.each(function(){
			var $el = $(this);
			$el.css('top', $el.data('_pix8-top'));
		});

		$('body').css('margin-top', Pix.marginBody);
	}
}


$(function(){
	Pix.collectFixed();
});

$.drop({ mode:true });

$(document).on('mouseleave', '.ggif,.youtube', function(ev){
	var carousel = $(ev.currentTarget).parent()[0].carousel;
	//if(carousel.stop)
		$(this).children('.iframe-cover').show();
});