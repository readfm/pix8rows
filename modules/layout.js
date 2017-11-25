$(function(){
	var showTags = function(){
		$nav.animate({left: 0}, 'fast', function(){
			$('#styleApps').html(Images.tag.cssShow);
		});
	};

	var $nav = $('#tags');
	$('#toggleTags').click(function(){
		if(!$nav.offset().left)
			Images.tag.hide()
		else{
			if($nav.hasClass('loaded'))
				showTags();
			else
				Images.tag.list().then(showTags);
		}
	});

	$(document).bind("keydown", function(ev){
		if(ev.keyCode == 27){
			$('#toggleTags').click();
		}
	});
});