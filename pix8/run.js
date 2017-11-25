window.carousel;

Site.ready.push(function(){
	var $pic = Pix.$pic = $("<div>", {id: 'pic', class: 'bar'}).prependTo('body');

	var $resize = $("<div id='pic-resize'></div>");
	$resize.appendTo($pic).dblclick(function(){
		if(!Cfg.toBottom) return;

		var onTop = !($pic.css('top') == 'auto');
		if(onTop){
			$pic.css({
				top: 'auto',
				bottom: 0
			});
			$resize.css({
				top: 0,
				bottom: 'auto'
			});
		}
		else{
			$pic.css({
				top: 0,
				bottom: 'auto'
			});
			$resize.css({
				top: 'auto',
				bottom: 0
			});
		}
	});

	var newCarousel = function(tag){
		var carousel;
		carousel = new Carousel({
			name: 'images',
			onAdd: function(url, $thumb){
				carousel.include(url, $thumb);
			}
		});

		carousel.$t.appendTo($pic);

		//Pix.resize($pic.height() + carousel.$t.height());

		carousel.loadView(tag);

		return carousel;
	}

	var carousels = [];

	var viewId;
	var updateView = function(){
		var ids = [];
		carousels.forEach(function(carousel){
			ids = ids.concat(carousel.getIds());
		});

		var carousel = carousels[0];

		if(!ids.length) return;
		console.log(ids);
		Pix.send({
			cmd: 'update',
			id: viewId,
			set: {
				items: ids
			},
			collection: Cfg.collection
		});
	};

	(function(){
		for(var i=0; i < 4; i++){
			var carousel = new Carousel({
				name: 'site images',
				onAdd: function(url, $thumb){
					carousel.include(url, $thumb);
				},
				dublicate: false
			});
			carousel.updateView = updateView;
			carousel.$t.addClass('splitted');
			carousel.$t.appendTo($pic);
			carousels.push(carousel);
		}
	})();


	var p = Site.p(document.location.pathname);

	if(p[0]){
		Pix.loadView(p[0], function(view){
			var carousel = carousels[0],
				i = 0;

			viewId = view.id;
			(view.items || []).forEach(function(id){
				if(carousel.width() < carousel.$t.width())
					carousel.push(id);
				else{
					var $next = carousel.$t.next();
					if($next.hasClass('splitted'))
						carousel = $next[0].carousel;
					else
						carousel.push(id);
				}
			});
		});
	}
	else{
		$pic.hide();
		$('#intro').show();
	}


	var $tag = Pix.$tag = $("<input id='pic-tag'/>").appendTo($resize);
	$tag.bindEnter(function(){
		if(this.value)
			newCarousel(this.value);
		this.value = '';
	}).click(function(){
		$tag.focus();
	});

	var resizeLast = function(){

	};


	Pix.$cover = $('#cover');
	jQuery.event.special.drag.defaults.not = '';
	$tag.drag("start", function(ev, dd){
		dd.height = parseInt($('#pic').height());
		var $carousel = $pic.children('.carousel').last();
		dd.carouselHeight = $carousel.height();
		dd.left = $carousel[0].scrollLeft;
		dd.clientX = ev.clientX;
		dd.done = 0;

		Pix.$cover.show();
	}, {click: true}).drag(function(ev, dd){
		var onTop = !($pic.css('top') == 'auto'),
			delta = dd.deltaY * (onTop?1:(-1));


		var $carousel = $pic.children('.carousel').last(),
			carousel = $carousel[0].carousel;


		var dif = dd.deltaY - dd.done;
		Pix.resize(dd.height + dd.deltaY);
		dd.done = dd.deltaY;

		var newL = (dd.left + dd.clientX) * carousel.$t.height() / dd.carouselHeight,
			dif = newL - dd.left - dd.clientX;
		carousel.t.scrollLeft = dd.left + dif;

		Pix.resize();
	}).drag("end", function(ev, dd){
		Pix.$cover.hide();
		var height = $('#pic').height();
		//chrome.storage.local.set({height: height});
		//chrome.runtime.sendMessage({cmd: 'resize', height: height});
		//Pix.leaveGap(height);
		//onScroll();
	});
	Site.resize();

	$('#pix8-toggle').click(function(){
		$('#pic').toggle();
		Site.resize();
	});

	
	var $trash = Pix.$trash = $("<div id='pic-trash'>&#10006;</div>").appendTo($pic);
	$trash.drop("start", function(ev, dd){
		console.log(dd);
		$(dd.proxy).css('opacity', 0.5);
		return true;
	}).drop("end", function(ev, dd){
		$(dd.proxy).css('opacity', 1);
	}).drop(function(ev, dd){
		var $thumb = $(dd.drag);
		var carousel = Pix.drag2carousel;
		$thumb.add(dd.proxy).remove();
		carousel.updateView();
	});

	
	if(Cfg.fixed){
		$pic.css('top', 0);
	}


	$(document).bind("keydown", function(ev){
		/*
		if(!carousel.$t.children('.focus').length){
			carousel.$t.children().eq(0).addClass('focus');
			return;
		}
		*/

		if(ev.keyCode == 37){
			carousel.motion(-25);
			//carousel.$t.children('.focus').prev().addClass('focus').siblings().removeClass('focus');
		}
		else
		if(ev.keyCode == 39){
			carousel.motion(25);
			//carousel.$t.children('.focus').next().addClass('focus').siblings().removeClass('focus');
		}
		else
		if(ev.keyCode == 13){
			//carousel.$t.children('.focus').click();
		}
	});

	$(document).bind("keyup", function(ev){
		if(ev.keyCode == 38){
			Site.resizeNext(Pix.$pic, -100);
		}
		else
		if(ev.keyCode == 40){
			Site.resizeNext(Pix.$pic, 100);
		}
	});


	Pix.$pic.on('dblclick', 'img', function(){
		if(this.src)

		var ipfs_i = this.src.indexOf('ipfs');
		if(ipfs_i < 0){
			if(this.src.indexOf(Cfg.files) < 0) return;
			Ggif.image.src = this.src;
			var id = Ggif.image.src.split('/').pop();
			ws.download(id).then(function(buf){
				Ggif.prepareBuf(buf);
			});
			return;
		}

		var ipfs_id = this.src.substr(ipfs_i+5);
		if(ipfs_id.length != 46) return;


		Ggif.image.src = this.src;
		Ggif.fromIpfs(ipfs_id);
		//Ggif.prepareBuf(this.src);
	});
});

/*
chrome.runtime.onMessage.addListener(function(d, sender, sendResponse){
	console.log(d);

  	if(d.cmd == 'carousel'){
  		if(d.do) $pic[d.do]();
  		sendResponse({
  			visible: $pic.is(':visible'),
  			height: $pic.height()
  		});

  		if($pic.is(':visible'))
  			Pix.leaveGap($pic.height());
  		else
  			Pix.restoreGap();
  	}
  	else
  	if(d.cmd == 'transformed'){
  		onScroll();
  	}
  	else
  	if(d.cmd == 'carousel.update'){
		if(carousel.getPath() == d.path)
			carousel.$tag.change();
  	}
  	else
  	if(d.cmd == 'auth'){
  		Pix.user = d.user;
  	}
  	if(d.cmd == 'files'){
  		carousel.files = d.files;
  	}
  	else
  	if(d.cmd == 'push'){
  		var $thumbOn = carousel.$t.children().eq(0);
  		carousel.include(Pix.parseURL(d.src), $thumbOn);
  	}
  	else
  	if(d.cmd == 'hideCarousel'){
  		$pic.hide();
  		sendResponse({visible: $pic.is(':visible')});
  		//sendResponse({pong: true});
  	}
  	else
  	if(d.cmd == 'checkCarousel'){
  		sendResponse({visible: $pic.is(':visible')});
  	}
  /* Content script action 
});
*/