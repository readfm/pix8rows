window.ui = window.UI = {
	modal: function(selector){
		ui.closeModals();
		$('#modal').show();
		if(selector)
			ui.resizeModal(selector);
		console.log(selector);
	},

	closeModals: function(){
		$('#modal').css('opacity', 0.7).hide();
		$('.modal').hide();
		console.trace();
	},

	resizeModal: function(selector){
		var $box = $(selector).show(),
			 $cont = $box.children('.cont');
		
		if($cont.length>0){
			$box.height($cont.outerHeight());
			$box.width($cont.outerWidth());
		}
	},

	side: function(selector, space){
		var $side = $(selector);

		//ui.closeSides();
		setTimeout(function(){
			$side.show().css($side.hasClass('right')?'right':'left', space || 0).trigger('open');
		}, 50);

		return $side;
	},

	closeSides: function(sel){
		if(!sel) sel = '.side';
		$(sel).each(function(){
			var $side = $(this);
			$side.css($side.hasClass('right')?'right':'left', -($side.outerWidth()+10));
			
			setTimeout(function(){
				if(parseInt($side.css('right')) < -100)
					$side.trigger('close');
			}, 700);
		});
	},

	openApp: function(selector){
		$('.app').hide();
		return $(selector).show();
	}
}

$(function(){
	ui.closeModals();
	ui.closeSides();
	$('.side > .x').click(function(){
		ui.closeSides(this.parentNode);
	});

	$(document).on('click', '.x', function(event){
		if($(event.target).parents('.slide').length)
			$(event.target).parents('.slide').slideUp();
	});

	$(document).ajaxSend(function(){
		$('#logo').addClass('spin');
	}).ajaxStop(function(){
		$('#logo').removeClass('spin');
	});

	$(document).click(function(ev){
		if(
			!$(ev.target).parents('.side').length && 
			!$(ev.target).hasClass('side') &&
			$(ev.target).is(':visible') &&
			!$(ev.target).parents('.tip').length && 
			!$(ev.target).hasClass('tip') &&
			!$(ev.target).parents('.modal').length && 
			!$(ev.target).parents('.options').length && 
			!$(ev.target).parents('.stay').length && 
			$(ev.target).attr('id') != 'modal'
		){
			ui.closeSides();
		}
	});

	document.addEventListener('dragover', q.p, false);
});