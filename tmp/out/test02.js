"use strict"; /*global jQuery, window, console, Image */
///*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
(function ($) {

	//ewdewdewdewdew
	if (typeof $ === undefined || $ !== window.jQuery) {
		throw ('$ wasn\'t set, make sure you\'ve got jQuery in the page');
	}
	var vcms, timerRegister = [];

	vcms = function (options, rootnode) {
		return vcms.fn.init(options, rootnode);
	};

	vcms.fn = {
		init: function (options, rootnode) {

			var returnObj = {},
				setup = {},
				ed, // event dispatcher 
				bindableEvents = [],
				param, // used in a for loop
				coreplugin, settings, defaults, config, datasourceHTML; // this is used to subscribe to the event dispatcher and fire events as part of the VCMS load sequence
			// this is a carry over from the old way we were doing this...
			defaults = {
				'config': {
					'environment': 'production'
				},
				'events': ['ready', 'play', 'ended', 'pause', 'unpause', 'reset', 'mute', 'unmute', 'mutehover', 'progress', 'metadataload', 'dataloaded', 'currenttime', 'volume', 'loadvideo', 'preloadvideo', 'buffering', 'loadvideoguid', 'videohover', 'videohoverout', 'videoadend', 'videostart', 'videoadstart', 'playerhover', 'playerhoverout', 'releaseend', 'videodetailsready', 'categorychange', 'selectcategory', 'shareopen', 'shareclose', 'sharetoggle', 'clearpanels', 'searchcall', 'mostwatchedchange', 'catlistready', 'loadplaylist', 'defaultscreen', 'fullscreen', 'playlistloaderror', 'loadfail']
			};

			settings = $.extend(true, defaults, options || {});

			returnObj.plugins = [];

			// set up the event dispatcher
			// this is how the plugins talk to each other
			ed = vcms.fn.eventdispatcher(settings.events);

			//#debug start
			ed.debug();
			//#debug end
			// set up the datasources
			datasourceHTML = vcms.datasources.classhtml({
				'html': $(rootnode).html()
			});

			// remove the original module content, it will be replaced with a dynamic one
			$(rootnode).find('.module-content').remove();

			// Add vcms-group selector to containing group
			$(rootnode).parents('.group').addClass('vcms-group');

			// config is an object with accessor function to a larger data object
			// this keeps things nice and private
			// no unauthorised access to data through the application
			setup.config = function () {
				config = vcms.configs({
					'name': settings.config.name,
					'environment': settings.config.environment,
					'playertype': settings.playertype || 'notdefined',
					'datasources': {
						'html': datasourceHTML
					},
					'adsEnabled': settings.config.adsEnabled
				});
			};

			// some of the functionality here is so close to the other functionality
			// we would be best placed to refactor into something shared
			setup.playertype = function (type) {
				var param, pluginObj, x, y, z, removePlugin, removePlugins = [],
					newPlugins = {},
					incPlugin;

				for (param in vcms.fn.playertypes[type]) {
					if (param) {
						vcms.fn.console.log('_core setup.playertype', param);

						if (!setup[param]) {
							throw ('There is no method "' + param + '" as part of setup, please check the way VCMS is being called (eg your load script)');
						}
						if (param === 'plugins') {
							//	Use vcms-removeplugin-[NAME OF PLUGIN] css class to remove unwanted plugins
							pluginObj = vcms.fn.playertypes[type][param];

							removePlugins = vcms.fn.classParser($(rootnode).attr('class'), "vcms-removeplugin-");

							for (x in pluginObj) {
								if (pluginObj.hasOwnProperty(x)) {
									newPlugins[x] = [];
									for (y in pluginObj[x]) {
										if (pluginObj[x].hasOwnProperty(y)) {
											incPlugin = true;
											for (z in removePlugins) {
												if (removePlugins.hasOwnProperty(z)) {
													removePlugin = removePlugins[z];
													if (typeof pluginObj[x][y] === "object") {
														incPlugin = (pluginObj[x][y].name === removePlugin) ? false : incPlugin;
													} else {
														incPlugin = (pluginObj[x][y] === removePlugin) ? false : incPlugin;
													}
												}
											}
											if (incPlugin) {
												newPlugins[x].push(pluginObj[x][y]);
											}
										}
									}
								}
							}

							pluginObj = newPlugins;

							$(rootnode).append(setup[param](pluginObj));
						} else {
							setup[param](vcms.fn.playertypes[type][param]);
						}
					}
				}
			};

			setup.events = function (events) {
				bindableEvents = events;
			};

			setup.modules = function (options) {
				var i, settings, defaults, module, classes = '';

				if ($.isArray(options)) {
					for (i = 0; i < options.length; i = i + 1) {
						setup.modules(options[i]);
					}
					return;
				}

				defaults = {
					'classes': null
				};

				settings = $.extend(defaults, options || {});

				if (settings.classes) {
					classes = ' ' + settings.classes;
				}

				module = $('<div class="module' + classes + ' ' + classes + '-ready"></div>');

				if (settings.plugins) {
					$(module).append(setup.plugins(settings.plugins));
				}

				if (settings.insertion) {
					// kinda working... might need tidying to asses the type better eg a switch with a function
					if (settings.insertion.type === 'replaceWith' || settings.insertion.type === 'after' || settings.insertion.type === 'append' || settings.insertion.type === 'prepend') {
						$(settings.insertion.target)[settings.insertion.type](module);
					} else {
						$(module)[settings.insertion.type](settings.insertion.target);
					}
				} else {
					$(rootnode).after(module);
				}
				return module;

			};

			setup.plugin = function (plugin, grouping) {
				var tmpOptions = {},
					tmpName, pluginObj;

				if (typeof plugin === 'string') {
					tmpName = plugin;
				} else {
					if (!plugin.name) {
						throw ('Plugin is missing a name value');
					}
					tmpName = plugin.name;
					tmpOptions = plugin.options;
				}

				if (!vcms.plugins[tmpName]) {
					throw ('Plugin vcms.plugins.' + tmpName + ' does not exist, check that the file is included from ./plugins/vcms.plugins.' + tmpName + '.js');
				}
				// setup the plugin
				tmpOptions.rootnode = rootnode;
				tmpOptions.config = config;
				pluginObj = vcms.plugins[tmpName](tmpOptions); // DL: this could be neater
				ed.subscribe(pluginObj);
				return pluginObj;
			};

			setup.plugins = function (plugins) {
				var i, grouping = 'default',
					returnObj = $('<div class="module-content"></div>'),
					contentItems = [],
					tmpElement;

				if (typeof plugins !== 'object') {
					throw ('plugins must be set as either an object of an array');
				}

				// if it's an array just loop through
				// if it's an object, loop through the objects then loop through the array of plugins
				if ($.isArray(plugins)) {
					for (i = 0; i < plugins.length; i = i + 1) {
						tmpElement = setup.plugin(plugins[i], grouping);
						$(returnObj).append(tmpElement.element);
					}
				} else {
					// loop through all the items
					for (grouping in plugins) {
						if (grouping) {
							contentItems[grouping] = $('<div class="content-item ' + grouping + '"></div>');
							for (i = 0; i < plugins[grouping].length; i = i + 1) {
								tmpElement = setup.plugin(plugins[grouping][i], grouping);
								$(contentItems[grouping]).append(tmpElement.element);
							}
							$(returnObj).append(contentItems[grouping]);
						}
					}
				}
				return returnObj;

			};

			// very messy...
			for (param in settings) {
				if (param) {
					vcms.fn.console.log(param);

					if (!setup[param]) {
						throw ('There is no method "' + param + '" as part of setup, please check the way VCMS is being called (eg your load script)');
					}

					if (param === 'plugins') {
						$(rootnode).append(setup[param](settings[param]));
					} else {
						setup[param](settings[param]);
					}
				}
			}

			// this function allows us to fire off events to everything else
			// at the point of creating the VCMS
			coreplugin = (function () {
				var returnObj = {};

				returnObj.ready = function () {
					$(rootnode).addClass('vcms-ready');
					$(returnObj).trigger('vcmsready');
				};

				return returnObj;
			}());

			ed.subscribe(coreplugin);

			coreplugin.ready();

			return {
				'rootnode': rootnode,
				'config': config
			}; // TODO: don't like this, need to assemble the modules then return them...
		},

		classParser: function (classStr, pattern, expectOne) {
			var regex = new RegExp(pattern + "[a-zA-Z]+", "gi"),
				matches = classStr.match(regex),
				x, foundPatterns = [];

			if (matches) {
				for (x = 0; x < matches.length; x += 1) {
					foundPatterns.push(matches[x].split(pattern).join(""));
				}
			}

			return (expectOne) ? (foundPatterns.length > 0) ? foundPatterns[0] : null : foundPatterns;
		},

		console: {
			log: function () {
				/* DL: removed to increase performance - TODO make it a location hash option 
                if (typeof console !== 'undefined') {
                    console.log(arguments[0], arguments[1]);
                }
*/
			}
		},
		/*
       Function: vcms.fn.eventdispatcher([events])

       Description:
           Sets up teh event dispatcher to understand which events will be in use
       
       Original Author:
           David Lewis   
           
       Parameters:
            events - Array with event names (eg: ['play', 'stop'])
            
        Example Initialisation:
        
        (start code)    
            var ed = vcms.eventDispatcher(['play', 'stop']);
        (end)
        
        Working Example:
        TBC


*/
		eventdispatcher: function (events) {
			var returnObj = {},
				subscribe, subscribers = [],
				broadcast, bind, debug, eventPrefix = 'vcms';


			/*
           Function: vcms.fn.eventdispatcher.subscribe({object})

           Description:
               Public methos of the Event Dispatcher object. Subscribes an object to the event dispatcher. Subscribed events will have events bound to them and will trigger methods that are valid
           
           Original Author:
               David Lewis   
               
           Parameters:
                Subsriber - Object
                
            Example Initialisation:
            
            (start code)    
                var ed = vcms.eventDispatcher(['play', 'stop']);
                var playbutton = vcms.plugins.play();
                ed.subscribe(playbutton);
            (end)
            
            Working Example:
            TBC


*/
			subscribe = function (subscriber) {
				var i;

				if (subscriber.length > 0) {
					for (i = 0; i < subscriber.length; i = i + 1) {
						subscribers.push(bind(subscriber[i]));
						if (subscriber[i].onsubscribe) {
							subscriber[i].onsubscribe();
						}
					}
				} else {
					subscribers.push(bind(subscriber));
					if (subscriber.onsubscribe) {
						subscriber.onsubscribe();
					}
				}
			};

			bind = function (subscriber) {
				var i;

				for (i = 0; i < events.length; i = i + 1) {
					$(subscriber).bind(eventPrefix + events[i], [events[i], this, subscriber], broadcast);
				}
				return subscriber;
			};

			broadcast = function () {
				var i, event = arguments[0].data[0];
				for (i = 0; i < subscribers.length; i = i + 1) {
					// arguments[0].data[2] !== subscribers[i] && if the broadcaster is the broadcastee then don't broadcast to it
					if (subscribers[i]['on' + event]) {
						subscribers[i]['on' + event](arguments);
					}
				}
			};

			/*
               Function: vcms.fn.eventdispatcher.debug()

               Description:
                   Method to switch on debugging to allow you to see the events being called on the plugins
               
               Original Author:
                   David Lewis   
                   
               Parameters:
                    none
                    
                Example Initialisation:
                
                (start code)    
                    var ed = vcms.eventDispatcher(['play', 'stop']);
                    ed.debug();
                (end)
                
                Working Example:
                TBC


*/
			debug = function () {

				vcms.fn.console.log('Binding debug object');
				var debugObj = {},
					i, debugFunction;

				debugFunction = function (name) {
					return function () {
						vcms.fn.console.log('EVENTS ' + eventPrefix + name, arguments);
					};
				};

				// create an object with every listener and trigger...
				for (i = 0; i < events.length; i = i + 1) {
					debugObj['on' + events[i]] = debugFunction(events[i]);
				}

				subscribe(debugObj);
			};

			// public
			returnObj.subscribe = subscribe;
			returnObj.debug = debug;
			return returnObj;
		},
		bandwidthCheck: function () {
			var imgSizes = [13058, 25499, 59795, 100916, 215563],
				baseImgURL = 'http://static.video.news.com.au/ipad/max',
				imgNumber = 4,
				startTime = (new Date()).getTime(),
				img = new Image(),
				videoType = 'wifi',
				// this will need to be part of something outside this function
				detectedVideoType;

			jQuery(img).load(function () {
				var imgSize = imgSizes[imgNumber],
					endTime = (new Date()).getTime(),
					downloadTime = (startTime === endTime) ? 0.01 : (endTime - startTime) / 1000,
					//conversion to seconds
					bytesPerSecond = imgSize / downloadTime,
					kbps = bytesPerSecond / 1000;

				if (kbps < 64) {
					//if (!cookieVideoType) {
					videoType = "threeg";
					//}
				}

				detectedVideoType = videoType;

			}).error(function () {
				//    Run callback anyway?
			}).attr('src', baseImgURL + imgNumber + '.jpg?ts=' + startTime);

		},

		//	Register a time to destroy when the video goes away
		//	type is one of 'timeout' or 'interval'
		registerTimer: function (timer, isInterval) {
			timerRegister.push({
				timer: timer,
				isInterval: isInterval || false
			});
		},

		//	Clears all registered timers
		clearTimers: function () {
			$.each(timerRegister, function (index, timerObj) {
				if (timerObj.isInterval) {
					window.clearInterval(timerObj.timer);
				} else {
					window.clearTimeout(timerObj.timer);
				}
			});
		}

	};

	vcms.plugins = {};
	vcms.datasources = {};
	vcms.templates = {};
	vcms.helpers = {};
	window.vcms = vcms;

}(jQuery));
