window.Cfg = {
	//server: '10.0.0.29:81/',
	//server: 'io.cx/',
	//server: 'taitis.com',
	server: 'io.cx',
	collection: 'pix8',
	files: 'http://files.mp3gif.com/',
	thumber: 'http://thumb.pix8.co/',
	collection: 'pix8',

	sites: {
		'pix8.co' : {
			intro: 'pix8.htm',
			title: 'Pix8. Better pictures. Faster.'
		},

		'foxtown.co' : {
			title: 'foxtown',
			intro: 'foxtown.htm',
			collection: 'foxtown'
		}
	},

	default: {
		tag: 'dog',
		sizeThumbs: 200
	},


	img: {
		height: 80
	},

	collector: {
		minWidth: 60,
		minHeight: 60,
		limit: 20
	}
};

Cfg.sites['images.lh'] = Cfg.sites['a.pix8.co'] = Cfg.sites['default'] = Cfg.sites['pix8.co'];
Cfg.sites['foxtown.lh'] = Cfg.sites['foxtown.co'];



var User = window.User = {
	id: '103915987270794097143'
}
