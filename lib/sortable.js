var drag = {
	start: function(e){
		console.log('drg');
		drag.$ = $(this).addClass('drag');
		drag.type = drag.getType(drag.$);
		
		e.dataTransfer.setData('fp', true);
		drag.fp = drag.$.index();
	},
	
	enter: function(){
		var $el = $(this);
		if(drag.$ && drag.getType($el) == drag.type)
			if(drag.$[0] != $el[0])
				drag.$['insert'+(drag.$.index()<$el.index()?'After':'Before')]($el);
		return false;
	},
	
	getType: function($el){
		if($el.hasClass('thumb'))return 'thumb';
		else return false;
	},

	cancel: function(e){
		if(e.preventDefault) e.preventDefault();
		e.dataTransfer.dropEffect = 'copy'; // tells the browser what drop effect is allowed here
		return false; // required by IE
	}
}

$.drop({
	tolerance: function(event, proxy, target){
		return this.contains( target, [ event.pageX, event.pageY ] );
	},
});

$.fn.sortable = function(cb){
	return this.each(function(){
		var $thumb = $(this),
		t = this,
		move = false,
		tw = $thumb.width()+1,
		th = $thumb.height();

		// remove previously associeted data by drag&drop lib.
		$thumb.off().removeData(['dragdata', 'dropdata']).click(function(){
			var o = $(this).offset();
			
			if(move) move = false;
			else{
				$(this).children('.iframe-cover').hide();
				var url = $(this).data('href');
				if(!url) return;
			}
		}).drag("init", function(ev, dd){
			console.log(dd);
		}).drag("start", function(ev, dd){
			dd.startParent = this.parentNode;

			dd.index = $(this).index();

			var $thumbd = $(this).clone().appendTo($(this).parent()).hide();
			$thumbd.css({position: 'absolute', opacity: 0.7}).removeClass('selected');

         	dd.update();

         	if($thumb.hasClass('selected')){
         		var $selected = $('.item.selected');
         		if($selected.length > 1){
         			$thumbd.append("<div class='count'>"+ $selected.length +"</div>");
         			var ids = [];
         			$selected.each(function(){
         				var id = $(this).data('id')
         				if(id && ids.indexOf(id)<0) ids.push(id);
         			});
         			console.log(ids);
         			console.log($thumbd[0]);
         			$thumbd.data('ids', ids);
         		}
			}
			return $thumbd;
		}).drag(function(ev, dd){
			var $proxy = $(dd.proxy);

			var dy = Math.abs(dd.deltaY),
				dx = Math.abs(dd.deltaX);

			$proxy.addClass('drag').show();

			$proxy.css({
				top: dd.offsetY,
				left: dd.offsetX
			});
			move = true;

	    	dd.update();
		},{ click: true, distance: 4}).drag("end", function(ev, dd){
			if(!move) return;
			
			setTimeout(function(){
				move = false;
			},100);

			$(dd.proxy).remove();

			var $thumb = $(this).removeClass('drop');
			$('.draggable').removeClass('draggable');

			var parent = $thumb.removeClass('drop').parent()[0];

			var ok = $(this).index() != dd.index;
			if(ok)
				if(cb) cb();
		}).drop("init",function(ev, dd){
			var $thumb = $(this);
			return !( this == dd.drag );
		}).drop("start", function(ev, dd){
			//console.log(this);
			var $thumb = $(this);
			//$('.drag').insertBefore();
			var ok = this != dd.drag;
			if(ok){
				var $drag = $(dd.drag);

				var bfr = $thumb.index() <= $drag.index();

				$drag['insert'+((bfr)?'Before':'After')]($thumb);

				dd.update();
			}
			return ok;
		}).drop(function(ev, dd){
			//console.log(this);
		}).drop("end",function(ev, dd){
		});

	});
}