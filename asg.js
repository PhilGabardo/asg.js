/*********************************************************************/
/************************* AUTOSUGGEST PLUGIN ************************/
/* 
 * jQuery plugin that takes an input and adds functionality for local
 *	or AJAX autocomplete. If no autocomplete source is provided, it 
 *  can also serve nicely as a change-event debouncer.
 *
 * Version: 0.8
 * Author: FindTheBest.com, Inc.
 * Updated: October, 2013
 */
/*********************************************************************/

(function ($) {
	var dataObj = 'asg';
	var ASG = function (argElement, argOpts) {

		////////////////////////////////////////////////////////////////
		var // PRIVATE VARS ////////////////////////////////////////////
			input, 
			suggestions,
			suggestions_ul,
			suggestions_up = false,
			options = $.extend({
				namespace: 'asg',
				classes: [],
				callback: function () {},
				source: null,
				delay: 300,
				minChars: 1,
				offsetTop: 7,
				putAbove: false,
				putLeft: false,
				numToSuggest: 10,
				leadingWildcard: false,
				staticPos: false,
				footer: null
			}, argOpts),
			ns = options.namespace, // Event/CSS namespace
			container = options.container, // Element to render results into
			lastValue,
			earlyReturn, // Indicates user pressed [Return] before results came back.
			tSug,	// Timer for rendering suggestions
			tHide,	// Timer for hiding suggestions
			listeners = { // Custom listeners (use these to avoid cluttering up this file)
					keyup: [],
					change: []
			},
			self = {};

		////////////////////////////////////////////////////////////////
		// PRIVATE METHODS /////////////////////////////////////////////
		var	init, buildHTML, update, showSuggestions, suggest, bindEvents,
			normalizeSuggestions, updatePosition, onInput, onCommand; 

		/**
		 * Initializes an autosuggest instance.
		 * @return object self
		 */
		init = function () {
			input = argElement;

			if ($.isArray(options.source)) {
				options.source = normalizeSuggestions(options.source);
			}
			if (options.putAbove) { options.classes.push('above'); }
			if (options.putLeft) { options.classes.push('left'); }

			buildHTML();
			bindEvents();
			return self;
		};

		/**
		 * Normalize the list to have {key: , value: } format.
		 * @param  array list
		 * @return array formatted_list
		 */
		normalizeSuggestions = function (list) {
			var i, v;
			if (!list.length) {
				return list;
			} else if (typeof list[0] === 'string') {
				for (i = 0; i < list.length; i++) {
					list[i] = {key: list[i],value: list[i]};
				}
			} else if (!list[0].key || !list[0].value) {
				for (i = 0; i < list.length; i++) {
					v = list[i].key || list[i].value;
					list[i].key = list[i].value = v;
				}
			}
			return list;
		};

		/**
		 * Builds the HTML for the suggestion modal. 
		 */
		buildHTML = function () {
			var classes = options.classes.join(' ');
			suggestions = $('<div class="'+ns+'-suggestions '+classes+'">'+
				'<ul class="'+ns+'-ul"></ul></div>');
			if (!options.noHide) {
				suggestions.hide();
			}
			if (options.footer) {
				var foot = options.footer;
				foot = foot.jquery ? foot : $(foot);
				suggestions.append(foot);
			}
			suggestions.appendTo(container || $('body'));
			suggestions_ul = suggestions.find('.'+ns+'-ul');
		};

		/**
		 * Call the callback function.
		 */
		update = function () {
			options.callback();
		};

		updatePosition = function () {
			if (options.staticPos) return;
			var 
			pos = {},
			offset = input.offset();
			if (options.putAbove) {
				pos.top = offset.top - (11 + options.offsetTop + suggestions.height());
			} else {
				pos.top = offset.top + 20 + options.offsetTop;
			}
			if (options.putLeft) {
				pos.left = offset.left + 5 + input.width() - suggestions.width();
			} else {
				pos.left = offset.left;
			}
			suggestions.css(pos);
		};

		/**
		 * Shows a list of suggestions.
		 * @param  array pool_of_suggestions
		 */
		showSuggestions = function (pool) {
			suggestions_ul.empty();
			suggestions_up = false;
			if (pool && pool.length) {
				var i, p, displayValue,
					lis = $('<ul/>'),
					limit = options.numToSuggest || 1000;
				for (i = 0; i < pool.length && i < limit; i++) {
					p = pool[i];
					displayValue = p.verbatim ? ('&#8220;'+p.value+'&#8221;') : p.value;
					$('<li class="'+ns+'-li">'
						+	'<span class="'+ns+'-img-wrap">'+(p.img ? '<img class="'+ns+'-img" src="'+p.img+'">' : '')+'</span>'
						+	'<span class="'+ns+'-label" tabindex="-1">'+displayValue+'</span>'
						+'</li>')
					.data(ns+'-data', p)
					[options.putAbove? 'prependTo' : 'appendTo'](lis)
					.find('.'+ns+'-img').load(updatePosition);
				}
				suggestions_ul.append(lis.children());
				updatePosition();
				suggestions_up = true;
			}
			if (!options.noHide) {
				suggestions[suggestions_up ? 'show' : 'hide']();
			}
		};

		/**
		 * Queries source, if any, with current state of input.
		 */
		suggest = function () {
			var i, 
				latest,
				src = options.source,
				pool = [], 
				val = input.val(),
				norm_callback = function (list) {
					if (latest < suggest.latest || tSug) { return; } // Exit if other suggestions are coming.
					else if (earlyReturn && (list||[]).length) { self.set(0,0,list[0]); update(); }
					else { showSuggestions(normalizeSuggestions(list)); }
				},
				regex = new RegExp((options.leadingWildcard ? '': '^') + val, 'i');
			tSug = 0;

			if (!val && options.minChars) {
				return;
			} else if (!src) {				// No suggestions
				self.set(val, val);
				update();
			} else if ($.isArray(src)) {	// Local suggestions
				for (i = 0; i < src.length; i++) {
					if (src[i].value.match(regex)) {
						pool.push(src[i]);
					}
				}
				showSuggestions(pool);
			} else if ($.isFunction(src)) {	// Callback suggestions
				latest = ++suggest.latest;
				src(null, val, norm_callback);				
			}
		};
		suggest.latest = 0;

		/**
		 * Bind all events used by the plugin.
		 */
		bindEvents = function () {
			input
			.on('change.'+ns, function (e) {
				for (var i = 0, l = listeners.change.length; i < l; i++) {
					listeners.change[i].call(input, e);
				}
				if (!input.val()) {
					update();
				} else if (!options.source) {
					if (tSug) { tSug = clearTimeout(tSug); }
					tSug = setTimeout(suggest, options.delay);
				}
			})
			.on('keydown.'+ns, onCommand)
			.on('keyup.'+ns, onInput)
			.on('blur.'+ns, function () {
				if (!options.noHide) {
					tHide = setTimeout(showSuggestions, 300);
				}
			})
			.on('focus.'+ns, function () {
				earlyReturn = 0;
				if (options.noHide) {
					return;
				}
				if (tHide) { tHide = clearTimeout(tHide); }
				if (!self.get() && (input.val() || !options.minChars)) {
					suggest();
				}
			});

			suggestions.on('click', 'li', function () {
				self.set(0,0,$(this).data(ns+'-data'));
				update();
			});
		};

		/**
		 * Listener fired when a key is pressed that
		 *	changes the content of the input.
		 */
		onInput = function (e) {
			e = e || window.event;

			for (var i = 0, l = listeners.keyup.length; i < l; i++) {
				listeners.keyup[i].call(input, e);
			}

			var sel, hadValue, 
			wasTyping = tSug, 
			value = input.val();
			earlyReturn = 0;

			if (value === lastValue && e.which !== 13) { return; }
			hadValue = !!self.get();
			self.set();
			lastValue = value;
			if (!value && options.minChars) {
				showSuggestions();
				return;
			}

			if (tSug) { tSug = clearTimeout(tSug); }

			if (e.which === 13) { // Enter
				if (e.preventDefault) { e.preventDefault(); }

				sel = suggestions.find('li.sel');
				if (!wasTyping && !sel.length) {
					sel = suggestions.find('.'+ns+'-li:'+(options.putAbove ? 'last' : 'first')+'-child');
				}
				if (!wasTyping && sel.length) {
					self.set(0,0,sel.data(ns+'-data'));
					update();
				} else {
					earlyReturn = 1;
					tSug = setTimeout(suggest, options.delay);
				}
				showSuggestions();
			} else if (input.val().length >= options.minChars) {	// Input
				tSug = setTimeout(suggest, options.delay);
			} else {
				showSuggestions();
			}
		};

		/**
		 * Listener fired when a non-input key is pressed.
		 *	Ex: Up, Down, Escape, Tab
		 */
		onCommand = function (e) {
			e = e || window.event;
			if (!suggestions_up) { return true; }
			var sel = suggestions.find('li.sel');
			if (!sel.length) { sel = suggestions.find('li:hover'); }
			switch (e.which) {
				case 38: // Up
					sel.removeClass('sel');
					if (e.preventDefault) { e.preventDefault(); }
					if (sel.length && sel.prev().length) { sel.prev().addClass('sel'); } 
					else { suggestions.find('ul li:last-child').addClass('sel'); }
					break;
				case 40: // Down
					sel.removeClass('sel');
					if (e.preventDefault) { e.preventDefault(); }
					if (sel.length && sel.next().length) { sel.next().addClass('sel'); } 
					else { suggestions.find('ul li:first-child').addClass('sel'); }
					break;
				case 27: // Escape
				case 9:  // Tab
					showSuggestions();
					break;
			}
		};

		////////////////////////////////////////////////////////////////
		// PUBLIC METHODS  /////////////////////////////////////////////
		
		/**
		 * Get current state of input. Returns undefined
		 *	if no valid item has been chosen.
		 * @return object value
		 */
		self.get = function () {
			var data = input.data(ns+'-data');
			if (data && data.key && data.value) {
				return data;
			}
		};

		/**
		 * Set state of the input. Value is optional, key is not.
		 * @param  string key 
		 * @param  string value
		 * @param  object keyAndValue
		 * @param  function callback
		 */
		self.set = function (key, value, obj, cb) {
			obj = obj || {
				key: key,
				value: value
			};
			var i, 
				src = options.source;
			if (obj.value && obj.key) {	// The nice case
				input.val(obj.value).data(ns+'-data', obj);
				(cb||$.noop)();
			} else if (obj.key) {	// Only key given
				obj.value = obj.key;
				input.val('...').data(ns+'-data', obj);
				if ($.isArray(src)) {
					var foundMatch = false;
					for (i = 0; i < src.length; i++) {
						if (src[i].key === obj.key) {
							self.set(src[i].key, src[i].value);
							foundMatch = true;
							break;
						}
					}
					if (!foundMatch) {	self.clear(); } 
					else { (cb||$.noop)(); }
				} else {
					src(obj.key, null, function (list) {
						if (list.length === 1) {
							list = normalizeSuggestions(list);
							self.set(0,0,list[0]);
							(cb||$.noop)();
						} else {
							self.clear();
						}
					});
				}
			} else {
				input.data(ns+'-data', null);
			}
		};

		/**
		 * Unset the input.
		 */
		self.clear = function () {
			input.val('').data(ns+'-data', null);
		};

		/**
		 * Unbind all events and remove all data.
		 */
		self.destroy = function () {
			suggestions.remove();
			input.data(ns+'-data',null).off('.'+ns);
		};

		self.on = function (event, callback) {
			listeners[event].push(callback);
		};

		/**
		 * Globally expose suggest method
		 */
		self.suggest = suggest;

		return init(argElement);
	};

	////////////////////////////////////////////////////////////////
	// PLUGIN EXPORT ///////////////////////////////////////////////
	$.fn[dataObj] = $.fn[dataObj.toUpperCase()] = function( method ) {
		var obj = this.data(dataObj);
		if ( !method || typeof method == 'object') {
			return obj || this.data(dataObj, ASG(this, method));
		} else if ( !obj ) {
			$.error('Cannot call "'+method+'" - Autosuggest not initialized.');
		} else {
			return obj[method].apply(obj, Array.prototype.slice.call( arguments, 1 ));
		}
	};
}( (window.FTB||{}).$ || window.jQuery ));
