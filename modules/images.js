window.Images = {
	items: {},

	// inset alreadey loaded image
	push: function(id){
		var $item;

		var item = Builder.items[id];
		if(!item) return;
		
		$item = Builder.item(item);

		Images.$list.append($item);

		return $item;
	},

	//take url and iserts new item into DB
	include: function(url, before){
		if(!url || url == Images.remove) return;

		var carousel = this;

		if(url.indexOf('http://')<0 && url.indexOf('https://')<0 && url.indexOf('ipfs://')<0)
			url = 'http://'+url;

		var item = {
			src: url,
			path: Images.view.path,
			//tag: carousel.$tag.val(),
			href: document.location.href,
			gid: User.id,
			type: 'image'
		};

		var save = function(){
			ws.send({
				cmd: 'save',
				item: item,
				collection: Images.collection
			}, function(r){
				if(!r || !r.item) return;
				
				Images.download2server(r.item);

				//pix.defaultView.carousels[carousel.$t.index()].items.push(r.item.id);
				Builder.items[r.item.id] = r.item;

				var image = Builder.item(r.item);

				if(before)
					$(image).insertBefore(before);
				else
					Images.$list.append(image);

				Images.updateView();
			});
		};

		var skipCheck = [
			'ggif.co',
			'th.ai',
			'youtu.be',
			'youtube.com'
		];

		if(skipCheck.some(function(service){
			return url.indexOf(service)+1;
		}))
			save()
		else{
			/*
			var $preloader = carousel.preloader();
			if($thumbOn && $thumbOn.length)
				$preloader.insertBefore($thumbOn);
			else
				carousel.$t.append($preloader);
			*/

			var img = new Image();
			var intr = setInterval(function(){
				if(!img.width || !img.height) return;
				clearInterval(intr);

				item.width = img.width;
				item.height = img.height;

				save();
			}, 500);

			img.onerror = function(){
				clearInterval(intr);
				//alert('Unable to load image');
				console.error('Unable to load image: '+url);
			};

			img.onload = function(){
				item.width = img.width;
				item.height = img.height;
				console.log('loaded');
			};
			img.src = url;
		}
			//db.post(item);
	},

	save2server: false,
	download2server: function(item){
		console.log(item);
		if(!Images.save2server) return;  //check if allowed
		if(item.file) return; // dont save uploads
		if(!item.width || !item.height || !item.src) return; //pass only images

		ws.send({
			cmd: 'fs.download',
			url: item.src
		}, function(r){
			if(!r.file) return;

			ws.send({
				cmd: 'update',
				id: item.id,
				set: {
					file: r.file.id
				},
				collection: Images.collection
			});
		});
	},

	upload: function(ev){
		console.info('upload');

		return false;
	},

	upload: function(ev){
		var files = ev.dataTransfer.files; // FileList object

	    // Loop through the FileList and render image files as thumbnails.
	    for (var i = 0, f; f = files[i]; i++){
			// Only process image files.
			if(!f.type.match('image.*'))
				continue;

			var reader = new FileReader();

			var lf = f;
			// Closure to capture the file information.
			reader.onload = function(ev1){
				var item = {
					src: ev1.target.result
				};

				var $item = Builder.item(item);
				$item.addClass('uploading');

				if(ev.target.src)
					$item.insertBefore(ev.target.parentNode);
				else
					Images.$list.append(image);

				var reader = new FileReader();
				reader.onload = function(ev2){
					ws.upload(ev2.target.result, function(file){
						if(!file) return $item.remove();

						var item = {
							src: Cfg.files+file.id,
							file: file.id,
							width: $item[0].width,
							height: $item[0].height,
							path: Images.view.path,
							//tag: carousel.$tag.val(),
							href: document.location.href,
							gid: User.id,
							type: 'image'
						};

						console.log(item);

						ws.send({
							cmd: 'save',
							item: item,
							collection: Images.collection
						}, function(r){
							if(r.item){
								Builder.items[r.item.id] = r.item;
								$item.removeClass('uploading');
								$item.data(r.item);
								$item.attr({
									id: 'image-'+r.item.id
								});
								Images.updateView();
							}
						});
					});
				}
				reader.readAsArrayBuffer(lf);
			};
			reader.readAsDataURL(f);
		};

		ev.preventDefault();
		return false;
	},

	dragged: function(image){
		var $image = $(image);

		Images.updateView();
	},

	getIds: function(){
		var ids = [];

		Images.$list.children().each(function(){
			var $item = $(this),
				item = $item.data();

			if(item.id && ids.indexOf(item.id)<0)
				ids.push(item.id);
		});

		return ids;
	},

	updateView: function(){
		//console.log(Images.view);
		if(Images.view && Images.view.id){
			ws.send({
				cmd: 'update',
				id: Images.view.id,
				set: {
					items: Images.getIds()
				},
				collection: Images.collection
			});
		}
		else
			Images.saveView();
	},

	// save list of id;s into database
	saveView: function(view){
		if(!view) view = {
			items: Images.getIds(),
			type: 'view',
			path: Images.path
		};

		view.gid = User.id;

		if(!view.items || !view.items.length) return;

		ws.send({
			cmd: 'save',
			item: view,
			collection: Images.collection
		}, function(r){
			if(r.item){
				Images.view = r.item;
			}
		});

		return view;
	},

	loadView: function(filter, cb){
		if(!filter)
			filter = {path: document.location.href}
		else
		if(typeof filter == 'object'){}
		else
		if(typeof filter == 'string'){
			//this.tag = filter;
			filter = {path: filter};
		}

		filter.gid = User.id;
		filter.type = 'view';

		ws.send({
			cmd: 'get',
			filter: filter,
			collection: Images.collection
		},
		function(r){
			if(r.item){
				var view = Images.view = r.item;

				Builder.collect(view.items).then(function(){
					cb(view);
				});
			}
			else cb();
		});
	},

	tag: {
		set: function(tag){
			tag = tag.replace(/\s+/g, '_');
			history.pushState({}, false, tag);
			Images.tag.hide();
			Images.laydown(tag);
		},

		list: function(){
			return new Promise(function(resolve, reject){
				ws.send({
					cmd: 'load',
					filter: {
						type: 'view',
						path: {$regex: '^(?!(http|https)://)'},
					},
					sort: {updated: -1},
					limit: 50,
					collection: Images.collection
				},
				function(r){
					var $list = $('#tags').empty();
					$list.addClass('loaded');
					(r.items || []).forEach(function(item){
						var $tag = $('<a>', {
							href: window.location.origin+'/'+item.path
						}).text(item.path);

						$list.append($tag);
					});

					(r.items && r.items.length)?
						resolve(r.items):
						reject('nothing found');
				});
			});
		},

		hide: function(){
			$('#styleApps').html('.app{margin-left: 0;}');
			$('#tags').animate({left: -300}, 'fast', function(){});
		},

		cssShow: `
			.app{margin-left: 250px;}
			.app > .full{width: calc(100% - 250px) !important;}
			.app > footer{left: 250px;}
		`
	},

	view: {},
	laydown: function(tag){
		Images.path = (tag || '').toLowerCase().replace(/\s+/g, '_');
		
		$('title').text(tag);
		$('#tag').val(tag);
		$('.app').hide();
		$('#pix').show();

		Images.loadView(Images.path, function(view){

			Images.view = view;
			var $list = Images.$list.empty();

			if(!view || !view.items || !view.items.length){
				Images.fill(Images.path);
			}
			else{
				(view.items || []).forEach(function(id){
					var $item = Builder.item(id);
					if(!$item) return;

					$list.append($item);
				});
			}
		});
	},

	laydownAll: function(tag){
		$('title').text(tag);
		$('#tag').val(tag);
		$('.app').hide();
		$('#pix').show();

		Builder.collectAll(tag).then(function(ids){
			var $list = Images.$list.empty();

			ids.forEach(function(id){
				var mod = {
					noSort: true,
					noRemove: true
				};

				var $item = Builder.item(id, mod);
				if(!$item) return;

				var item = $item.data();

				if(item.src && $list.find('*[src="'+item.src+'"]').length)
					return;

				$list.append($item);
			});
		});
	},

	laydownDate: function(dt){
		if(dt.length != 6) return;

		$('.app').hide();
		$('#pix').show();

		var timeFrom = new Date('20'+dt[0]+dt[1]+'-'+dt[2]+dt[3]+'-'+dt[4]+dt[5]).getTime(),
			timeTo = new Date('20'+dt[0]+dt[1]+'-'+dt[2]+dt[3]+'-'+dt[4]+(parseInt(dt[5])+1)).getTime();

		console.log('20'+dt[0]+dt[1]+'-'+dt[2]+dt[3]+'-'+dt[4]+(parseInt(dt[5])+1));

		return new Promise(function(resolve, reject){
			ws.send({
				cmd: 'load',
				filter: {
					time: {
						$gt: timeFrom,
						$lt: timeTo
					},
				},
				collection: Cfg.collection
			}, function(r){
				var $list = Images.$list.empty();

				(r.items || []).forEach(function(item){
					Builder.items[item.id] = item;
				
					var mod = {
						noSort: true,
						noRemove: true
					};

					var $item = Builder.item(item.id, mod);
					if(!$item) return;

					$list.append($item);
				});

				$('#tag').val('');
				resolve(r.items);
			});
		});
	},


	g: 'https://www.googleapis.com/customsearch/v1?key=AIzaSyCG9TzinRXo42CrGCYiOBh9pOV-MXrbdL4&&cx=005276605350744041336:wifcwjx3hiw&searchType=image&q=',
	searchGoogle: function(q, cb){
		$.getJSON(Images.g + q, function(r){
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

	// if not enogh items inside carousel then load some more from google images.
	loading: 0,
	fill: function(path){
		var Images = this;

		console.log(path);
		if(Images.loading) return;
		
		Images.fillPath = path;
		Images.searchGoogle(path, function(images){
			console.log(images);
			Images.$list.children().remove();

			var images = images.slice(0, Cfg.collector.limit);
			Images.loading = images.length;

			images.forEach(function(url){
				if(url.indexOf('http://')<0 && url.indexOf('https://')<0)
					url = 'http://'+url;

				var finish = function(){
					Images.saveView();
					Images.loading = false;
				};

				var img = new Image();
				img.onload = function(){
					if(
						Cfg.collector.minWidth > img.width ||
						Cfg.collector.minHeight > img.height
					) return Images.loading--;

					var item = {
						path: path,
						type: 'image',
						src: url,
						gid: User.id,
						width: img.width,
						height: img.height
					};

					ws.send({
						cmd: 'save',
						item: item,
						collection: Images.collection
					}, function(r){
						Images.loading--;
						
						if(r.item){
							Builder.items[r.item.id] = r.item;
							var $thumb = Images.push(r.item.id);
						}

						if(Images.loading === 0)
							finish();
					});
					//db.post(item);
				}
				img.onerror = function(){
					Images.loading--;

					if(Images.loading === 0)
						finish();
				};

				img.src = url;
			});
		});
	},
}

Site.load = function(ur){
	Images.$list = $('#images-list');

	function cancel(e){
		if (e.preventDefault) e.preventDefault(); // required by FF + Safari
		e.dataTransfer.dropEffect = 'copy'; // tells the browser what drop effect is allowed here
		return false; // required by IE
	}
	
	document.addEventListener('dragover', cancel);
	document.addEventListener('dragenter', cancel);
	document.addEventListener('drop', function(ev){
		if(ev.dataTransfer.files.length)
			return Images.upload(ev);
		
		var url = ev.dataTransfer.getData('URL') || ev.dataTransfer.getData('Text');

		var qs = Site.parseQS(decodeURIComponent(url));
		if(qs && qs.imgurl) 
			url = qs.imgurl;

		if(!Images.$list.find('img[src="'+url+'"]').length){
			var image = ev.target.src?ev.target.parentNode:null;
			Images.include(url, image);
		}

		ev.preventDefault();
		return false
	}, false);

	
	$('#remove').drop('start', function(ev, dd){
		//var url = ev.dataTransfer.getData('URL') || ev.dataTransfer.getData('Text');
		$('#remove').addClass('active');
	}).drop(function(ev, dd){
		$('#remove').removeClass('active').fadeOut('fast');
		var item = $(dd.drag).data(),
			proxy = $(dd.proxy).data();

		if(!item.id && !proxy.ids) return;
		$(dd.drag).remove();
		$(dd.proxy).remove();

		if(proxy.ids){
			proxy.ids.forEach(function(id){
				console.log(id);
				$('#image-'+id).remove();
			});
		}

		Images.updateView();
	}).drop('end', function(ev, dd){
		$('#remove').removeClass('active');
	});

	var p = Site.p(ur);

	var filter = {};
	//if(p[0])

	var s = Cfg.sites[location.host] || Sites.default;

	console.log(s);

	Images.collection = Builder.collection = s.collection || Cfg.collection;

	if(location.host.indexOf('foxtown')+1){
		Images.save2server = true;
	};

	var tag = decodeURIComponent(p[0]);// || Cfg.default.tag;
	if(!isNaN(tag))
		Images.laydownDate(tag);
	else
	if(tag && tag.indexOf('-') === 0){
		tag = tag.substr(1);
		Images.laydownAll(tag);
	}
	else
	if(tag) Images.laydown(tag);
	else{
		if(location.host.indexOf('foxtown')+1){
			tag = 'foxtown'
			Images.tag.set(tag);
		}
		else{
			$('title').text(s.title);
			
			$.get('views/'+s.intro, function(text){
				$('#intro').html(text).show();
			}, 'text');
		}
	};



	$('#tag').val(tag.replace(/\s+/g, '_'));
	$('#tag').change(function(ev){
		Images.tag.set(this.value);
	});

	$('#tags').on('click', 'a', function(ev){
		Images.tag.set(this.textContent);
		ev.preventDefault();
		return false;
	});

	/*
	var css_showNav = `
		.app{margin-left: 300px;}
		.app > .full{width: calc(100% - 300px) !important;}
		.app > footer{left: 300px;}
	`;
	*/

	var $style = $('#style-thumbs');
	var resizeThumbs = function(size){
		$style.html('#images .item{height: '+size+'px;} .item>iframe{width: '+size*2+'px;}');
	};

	var sizeThumbs = parseInt(Cookies.get('sizeThumbs')) || Cfg.default.sizeThumbs;
	resizeThumbs(sizeThumbs);

	$('#head').drag(function(ev, dd){
		resizeThumbs(sizeThumbs+dd.deltaX/2);
	}).drag('end', function(ev, dd){
		sizeThumbs += dd.deltaX/2;
		Cookies.set('sizeThumbs', sizeThumbs);
	});
}

// select multiple
$(function(){
	$('#images').on('click', '.item', function(ev){
		if(!ev.ctrlKey){
			$('#images .selected').removeClass('selected');
		}
		else{
			var $item = $(this);
			$item.toggleClass('selected');

			var text = "";
			$('#images .selected').each(function(){
				var item = $(this).data();
				text += item.id + '\n';
			});

			$('#clipboard').val(text);
		}
	});
});

$(function(){
	$(document).bind("keydown", function(ev){
		if(ev.ctrlKey && ev.keyCode == 67){
			var text = $('#clipboard').select().text();
			document.execCommand('copy');
		}
	});

	document.addEventListener('paste', function(ev){
		var text = ev.clipboardData.getData('Text');
		if(!text) return;
		
		var ids = text.match(/[^\r\n]+/g);
		if(!ids || !ids.length) return;

		var itemsL = [];
		ids.forEach(function(id){
			var item = Builder.items[id];
			if(item) itemsL.push(item);
		});

		Builder.collect(ids).then(function(items){
			[].concat(itemsL, items).forEach(function(item){
				if(!item || Images.$list.find('*[src="'+item.src+'"]').length) return;
				var $item = Builder.item(item);
				Images.$list.prepend($item);
			});
			Images.updateView();
		});
	});
});