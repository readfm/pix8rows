window.Builder = {
	items: {},
	collect: function(ids){
		var newIds = [];
		ids.forEach(function(id){
			if(!Builder.items[id])
				newIds.push(id);
		});

		return new Promise(function(resolve, reject){
			if(!newIds.length) return resolve();

			ws.send({
				cmd: 'load',
				filter: {
					id: {$in: newIds},
				},
				collection: Builder.collection
			}, function(r){
				(r.items || []).forEach(function(item){
					Builder.items[item.id] = item;
				});

				resolve(r.items);
			});
		});
	},


	collectAll: function(path){
		var fltr = {
			path: path
		};

		return new Promise(function(resolve, reject){
			ws.send({
				cmd: 'load',
				filter: fltr,
				sort: {time: -1},
				collection: Builder.collection
			}, function(r){
				var ids = [];
				(r.items || []).forEach(function(item){
					Builder.items[item.id] = item;
					ids.push(item.id);
				});

				resolve(ids);
			});
		});
	},

	item: function(item, mod){
		if(typeof item == 'string' || typeof item == 'number')
			item = Builder.items[item];
		if(!item) return;

		if(!mod) mod = {};

		var $thumb = $('<span>', {id: 'image-'+(item.id || 'uploading'), class: 'item'});
		$thumb.data(item);

		if(item.src)
			Builder.thumbnail($thumb, item);
		else
		if(item.file)
			item.src = Cfg.files + item.file;

		
		if(Builder.youtube($thumb, item)){}
		else
		if(item.src && item.src.indexOf('ggif.co')+1)
			Builder.ggifFrame($thumb, item);
		else
			Builder.image($thumb, item);

		/*
		if(item.width && item.height){
			$thumb.css({
				width: parseInt($thumb.css('height'))*item.width/item.height
			});
		};
		*/

		if(!mod.noSort)
			$thumb.sortable(function(){
				Images.dragged($thumb);
			});

		if(!mod.noRemove)
			$thumb.drag("start", function(ev, dd){
				$('#remove').fadeIn('fast');
			}).drag("end", function(){
				$('#remove').fadeOut('fast');
			});

		return $thumb;
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

	thumbnail: function($thumb, item){
		var thumb;


		if(item.src){
			if(item.src.indexOf('data:image')==0) return;

			var video = Builder.parseVideoURL(item.src);
		}

		if(video && video.provider == 'youtube')
			thumb = 'http://img.youtube.com/vi/'+video.id+'/sddefault.jpg';
		else{
			var u = item.src.split('://');
			thumb = Cfg.thumb+u[0]+'/'+u[1];
		}

		$thumb.css('background-image', 'url('+thumb+')');

		return $thumb;
	},

	image: function($thumb, item){
		var image = new Image,
			$image = $(image).appendTo($thumb);

		if(item.file){
			image.src = Cfg.files+item.file;

			$(image).dblclick(function(){
				Builder.playAudio(image);
			});
		}
		else
		if(item.src)
			image.src = item.src;

		
		return image;
	},

	youtube: function($thumb, item){
		if(item.src){
			var video = Builder.parseVideoURL(item.src),
				vid = video.provider;
		}

		if(!video || video.provider != 'youtube') return;

		var frame = document.createElement("iframe");
			frame.src = 'https://www.youtube.com/embed/'+video.id;
		$thumb.addClass('youtube').append(frame);
		$thumb.append("<div class='iframe-cover'></div>");

		return frame;
	},

	ggifFrame: function($thumb, item){
		var p = item.src.replace('http://', '').split(/[\/]+/);
		//var thumb = 'http://'+p[0]+'/'+p[1]+'/'+p[1]+'.gif';

		var frame = document.createElement("iframe");
		frame.onload = function(){

		}
		frame.onerror = function(){
			$thumb.parent().children('span[href="'+item.src+'"]').remove();
		}

		//frame.width = h;
		//frame.height = h;
		frame.src = item.src.replace('http://', 'https://');
		$thumb.addClass('ggif').append(frame);
		$thumb.append("<div class='iframe-cover'></div>");
		//$thumb.append("<div class='iframe-cover'></div>");

		return $thumb;
	},

	// preload ggif, extract and play that audio.
	playAudio: function(img){
		var id = img.src.split('/').pop();

		if(img.audio){
			img.src = img.src;
			img.audio.currentTime = 0;
			img.audio.play();
			img.audio.volume = 1;
		}
		else
			ws.download(id).then(function(buf){
				var ggif = new GifReader(buf);
				var sound = buf.slice(ggif.p)
				if(sound.length){
					var blob = new Blob([sound], {type: "audio/ogg;base64"});
					img.audio = new Audio;
			    	img.audio.src = URL.createObjectURL(blob);
					img.src = img.src;

			    	img.audio.addEventListener('ended', function() {
					    this.currentTime = 0;
					    if(this.volume <= 0.25) return false;
					    this.volume = this.volume - 0.25;
					    this.play();
					}, false);

					img.audio.currentTime = 0;
			    	img.audio.play();
				}
			});
	}
}

$(function(){
	$(document).on('mouseleave', '.ggif,.youtube', function(ev){
		$(this).children('.iframe-cover').show();
	});

	$(document).on('click', '.iframe-cover', function(ev){
		$(this).hide();
	});
});