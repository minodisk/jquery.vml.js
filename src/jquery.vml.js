/*!
 * jQuery vml Plugin v0.0.4.scaling
 * https://github.com/minodisk/jquery.vml.js
 *
 * Copyright (c) 2011 Daisuke MINO
 * Licensed under the MIT license.
 * https://github.com/minodisk/jquery.vml.js/raw/master/MIT-LICENSE
 *
 * Thanks
 * Some code is used DD_belatedPNG (http://www.dillerdesign.com/experiment/DD_belatedPNG/) written by Drew Diller is as a reference.
 * Some magic numbers of shape and fill properties found by Atsunori IIDA makes possible scaling animation.
 */

(function ($) {

	//------------------------------------------------------------------------------------------------------------------
	// PRIVATE CONSTANCE
	//------------------------------------------------------------------------------------------------------------------

	var _NAMESPACE = 'jquery_vml_js';


	//------------------------------------------------------------------------------------------------------------------
	// PRIVATE VARIABLES
	//------------------------------------------------------------------------------------------------------------------

	var _isTargetBrowser;


	//------------------------------------------------------------------------------------------------------------------
	// PRIVATE METHODS
	//------------------------------------------------------------------------------------------------------------------

	function _init() {
		var doc = document,
			docMode = doc.documentMode;
		_isTargetBrowser = /*@cc_on!@*/false && ( (docMode && (docMode <= 8)) || (parseFloat($.browser.version) <= 7) );
		if (_isTargetBrowser) {
			if (!doc.namespaces[_NAMESPACE]) {
				doc.namespaces.add(_NAMESPACE, 'urn:schemas-microsoft-com:vml');
			}
			var nodeNames = (docMode === 8) ? ['shape', 'fill'] : ['*'],
				selectors = [],
				i, len;
			for (i = 0,len = nodeNames.length; i < len; i++) {
				selectors[i] = _NAMESPACE + '\\:' + nodeNames[i];
			}
			$('head').prepend($('<style type="text/css">' + selectors.join(', ') + ' { behavior: url(#default#VML); }</style>'));

			_override();
		}
	}

	function _replaceWithVML(elem) {
		var $elem = $(elem);
		if (elem.nodeName.toLowerCase() === 'img') {

			var $vml = _wrapWithVML($elem, $elem.attr('src'), $elem.width(), $elem.height(), 0, 0);
			$elem[0].fill.type = 'frame';
			$elem[0].isImageNode = true;
			$elem.css('visibility', 'hidden');

		} else if (elem.currentStyle.backgroundImage.toLowerCase().search(/(\.jpg|\.jpeg|\.png|\.gif)/) != -1) {

			var backgroundImage = $elem.css('backgroundImage');
			var src = backgroundImage.substr(5, backgroundImage.length - 7);
			var isNoRepeat = $elem.css('backgroundRepeat').indexOf('no') !== -1;

			var width = (isNoRepeat) ? $elem.width() : $elem.innerWidth();
			var height = (isNoRepeat) ? $elem.height() : $elem.innerHeight();
			var x = _figurePosition($elem.css('backgroundPositionX'), width);
			var y = _figurePosition($elem.css('backgroundPositionY'), height);
			var $vml = _wrapWithVML($elem, src, width, height, x, y, isNoRepeat);
			$elem[0].fill.type = 'tile';
			$elem[0].isImageNode = false;
			$elem
				.css({
				         position: 'relative',
				         margin: 0,
				         // If sets the background image 'none', the element loses hit area.
				         // So, replace the background image with a 1px transparent Base64 encoded gif.
				         backgroundImage: 'url(data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)'
				     })
				.bind('mouseenter', _onMouseEvents)
				.bind('mouseleave', _onMouseEvents)
				.bind('mousedown', _onMouseEvents)
				.bind('mouseup', _onMouseEvents)
				.bind('blur', _onMouseEvents);

		}
	}

	function _figurePosition(pos, size) {
		var ratio;
		switch (pos) {
			case 'left':
			case 'top':
				ratio = 0;
				break;
			case 'center':
				ratio = 0.5;
				break;
			case 'right':
			case 'bottom':
				ratio = 1;
				break;
			default:
				if (pos.indexOf('%') != -1) {
					ratio = parseFloat(pos) / 100;
				}
				break;
		}

		return (ratio !== undefined) ? size * ratio : parseFloat(pos);
	}

	function _wrapWithVML($elem, src, width, height, x, y, clip) {
		var opacity = $elem.css('opacity'),
			borderLeftWidth = $elem.css('borderLeftWidth');

		var inheritStyleProps = [
			'opacity',
			'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
			'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
			'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle',
			'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
			'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'
		],
			inheritStyle = {},
			i, len, prop;
		for (i = 0, len = inheritStyleProps.length; i < len; i++) {
			prop = inheritStyleProps[i];
			inheritStyle[prop] = $elem.css(prop);
		}
		$elem.css({
			marginLeft: 0,
			borderLeft: 0
		});

		var width2Str = (width * 2).toString(),
			height2Str = (height * 2).toString();
		var $shape = $('<' + _NAMESPACE + ':shape />')
			.width(width)
			.height(height)
			.css('position', 'absolute')
			.attr('coordorigin', '1,1')
			.attr('coordsize', width2Str + ',' + height2Str)
			.attr('path', 'm 0,0 l ' + width2Str + ',0, ' + width2Str + ',' + height2Str + ', ' + '0,' + height2Str + ' x e')
			.attr('stroked', 'false')
			.attr('filled', 'true');

		if (clip) {
			$shape.css('clip', 'rect(1.01px ' + width.toString() + 'px ' + height.toString() + 'px 1.01px)');
		}

		var $fill = $('<' + _NAMESPACE + ':fill />')
			.attr('src', src)
			.appendTo($shape);

		var $vml = $('<div></div>')
			.addClass(_NAMESPACE)
			.width(width)
			.height(height)
			.css({
			         position: 'relative'/*,
			         marginTop: $elem.css('marginTop'),
			         marginRight: $elem.css('marginRight'),
			         marginBottom: $elem.css('marginBottom'),
			         marginLeft: $elem.css('marginLeft')*/
			     })
			.appendTo($elem.parent());
		$shape
			.appendTo($vml)
			.attr('fillcolor', 'none');     // Set 'fillcolor' after adding the shape to document, or it doesn't work.
		$elem.appendTo($vml);

		var elem = $elem[0];
		elem.vml = $vml[0];
		elem.shape = $shape[0];
		elem.fill = $fill[0];
		elem.isVML = true;
		elem.positionX = 0;
		elem.positionY = 0;
		$.cssHooks.backgroundPositionX.set($elem[0], x, '', true);
		$.cssHooks.backgroundPositionY.set($elem[0], y, '', true);

		if ($elem[0].isPNG = (src.search('.png') != -1)) {
			$fill.attr('opacity', inheritStyle.opacity);
		} else {
			$shape.css('opacity', inheritStyle.opacity);
		}
		$vml.css('opacity', inheritStyle.opacity);
		$.cssHooks.marginLeft.set($vml[0], inheritStyle.marginLeft);
		$.cssHooks.borderLeftStyle.set($vml[0], inheritStyle.borderLeftStyle);
		$.cssHooks.borderLeftWidth.set($vml[0], inheritStyle.borderLeftWidth);
		$.cssHooks.borderLeftColor.set($vml[0], inheritStyle.borderLeftColor);
		$.cssHooks.paddingLeft.set(elem, inheritStyle.paddingLeft);

		return $vml;
	}

	function _onMouseEvents(e) {
		var that = this;
		// wait for next event loop
		setTimeout(function () {
			$.cssHooks.backgroundPositionX.set(that, $(that).css('backgroundPositionX'), '', true);
			$.cssHooks.backgroundPositionY.set(that, $(that).css('backgroundPositionY'), '', true);
		}, 0);
	}

	var ralpha = /alpha\([^)]*\)/i,
		ropacity = /opacity=([^)]*)/,
		rnumpx = /^-?\d+(?:px)?$/i;

	function _getOpacityAsFilter(elem, computed) {
		// IE uses filters for opacity
		return ropacity.test((computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "") ?
			(parseFloat(RegExp.$1) / 100) + "" :
			computed ? "1" : "";
	}

	function _setOpacityAsFilter(elem, value) {
		var style = elem.style;

		// IE has trouble with opacity if it does not have layout
		// Force it by setting the zoom level
		style.zoom = 1;

		// Set the alpha filter to set the opacity
		var opacity = jQuery.isNaN(value) ?
			"" :
			"alpha(opacity=" + value * 100 + ")",
			filter = style.filter || "";

		style.filter = ralpha.test(filter) ?
			filter.replace(ralpha, opacity) :
			style.filter + ' ' + opacity;
	}

	function _override() {
		if (!$.cssHooks) {
			throw new Error('jQuery 1.4.3 or above is required for jquery.vml.js to work.');
			return;
		}

		if (!jQuery.support.opacity) {
			jQuery.cssHooks.opacity = {
				get: function(elem, computed) {
					if (elem.isVML) {
						if (elem.isPNG) {
							return parseFloat(elem.fill.opacity);
						} else {
							return _getOpacityAsFilter(elem.shape, computed);
						}
					} else {
						return _getOpacityAsFilter(elem, computed);
					}
				},
				set: function(elem, value) {
					if (elem.isVML) {
						if (elem.isPNG) {
							elem.fill.opacity = value;
						} else {
							_setOpacityAsFilter(elem.shape, value);
						}
						if (!elem.isImageNode) {
							_setOpacityAsFilter(elem, value);
						}
					} else {
						_setOpacityAsFilter(elem, value);
					}
				}
			};
		}

		$.cssHooks.left = {
			get: function (elem, computed) {
				if (elem.isVML) {
					return elem.vml.style.left;
				} else {
					return elem.style.left;
				}
			},
			set: function (elem, value) {
				if (elem.isVML) {
					elem.vml.style.left = value;
				} else {
					elem.style.left = value;
				}
			}
		};
		$.fx.step.left = function (fx) {
			$.cssHooks.left.set(fx.elem, fx.now + fx.unit);
		};

		$.cssHooks.top = {
			get: function (elem, computed) {
				if (elem.isVML) {
					return elem.vml.style.top;
				} else {
					return elem.style.top;
				}
			},
			set: function (elem, value) {
				if (elem.isVML) {
					elem.vml.style.top = value;
				} else {
					elem.style.top = value;
				}
			}
		};
		$.fx.step.top = function (fx) {
			$.cssHooks.top.set(fx.elem, fx.now + fx.unit);
		};

		var _super = {
			width: $.cssHooks.width,
			height: $.cssHooks.height
		};

		$.cssHooks.marginLeft = {
			get: function (elem, computed, extra) {
				if (elem.isVML) {
					return elem.vml.style.marginLeft;
				} else {
					return elem.currentStyle.marginLeft;
				}
			},
			set: function (elem, value) {
				if (elem.isVML) {
					elem.vml.style.marginLeft = value;
				} else {
					elem.style.marginLeft = value;
				}
			}
		};
		$.fx.step.marginLeft = function (fx) {
			$.cssHooks.marginLeft.set(fx.elem, fx.now + fx.unit);
		};

		$.cssHooks.borderLeftStyle = {
			get: function (elem, computed, extra) {
				if (elem.isVML) {
					return elem.vml.style.borderLeftStyle;
				} else {
					return elem.currentStyle.borderLeftStyle;
				}
			},
			set: function (elem, value) {
				if (elem.isVML) {
					elem.vml.style.borderLeftStyle = value;
				} else {
					elem.style.borderLeftStyle = value;
				}
			}
		};
		$.fx.step.borderLeftStyle = function (fx) {
			$.cssHooks.borderLeftStyle.set(fx.elem, fx.now + fx.unit);
		};

		$.cssHooks.borderLeftWidth = {
			get: function (elem, computed, extra) {
				if (elem.isVML) {
					return elem.vml.style.borderLeftWidth;
				} else {
					return elem.currentStyle.borderLeftWidth;
				}
			},
			set: function (elem, value) {
				if (elem.isVML) {
					elem.vml.style.borderLeftWidth = value;
				} else {
					elem.style.borderLeftWidth = value;
				}
			}
		};
		$.fx.step.borderLeftWidth = function (fx) {
			$.cssHooks.borderLeftWidth.set(fx.elem, fx.now + fx.unit);
		};

		$.cssHooks.borderLeftColor = {
			get: function (elem, computed, extra) {
				if (elem.isVML) {
					return elem.vml.style.borderLeftColor;
				} else {
					return elem.currentStyle.borderLeftColor;
				}
			},
			set: function (elem, value) {
				if (elem.isVML) {
					elem.vml.style.borderLeftColor = value;
				} else {
					elem.style.borderLeftColor = value;
				}
			}
		};
		$.fx.step.borderLeftColor = function (fx) {
			$.cssHooks.borderLeftColor.set(fx.elem, fx.now + fx.unit);
		};

		$.cssHooks.paddingLeft = {
			get: function (elem, computed, extra) {
				if (elem.isVML && elem.isImageNode) {
					return elem.vml.style.paddingLeft;
				} else {
					return elem.currentStyle.paddingLeft;
				}
			},
			set: function (elem, value) {
				/*if (elem.id == 'checkIt') {
					alert([elem.isVML, elem.isImageNode]);
				}/**/
				if (elem.isVML && elem.isImageNode) {
					elem.vml.style.paddingLeft = value;
				} else {
					elem.style.paddingLeft = value;
				}
			}
		};
		$.fx.step.paddingLeft = function (fx) {
			$.cssHooks.paddingLeft.set(fx.elem, fx.now + fx.unit);
		};

		$.cssHooks.width = {
			get: function(elem, computed, extra) {
				if (elem.isVML && elem.shape.style) {
					return elem.shape.style.width;
				} else {
					return _super.width.get(elem, computed, extra);
				}
			},
			set: function(elem, value) {
				if (elem.isVML) {
					elem.shape.style.width = value;
					if (!elem.isImageNode) {
						elem.style.width = value;
					}
				} else {
					return _super.width.set(elem, value);
				}
			}
		};
		$.fx.step.width = function (fx) {
			$.cssHooks.width.set(fx.elem, fx.now + fx.unit);
		};

		$.cssHooks.height = {
			get: function(elem, computed, extra) {
				if (elem.isVML && elem.shape.style) {
					return elem.shape.style.height;
				} else {
					return _super.height.get(elem, computed, extra);
				}
			},
			set: function(elem, value) {
				if (elem.isVML) {
					elem.shape.style.height = value;
					if (!elem.isImageNode) {
						elem.style.height = value;
					}
				} else {
					return _super.height.set(elem, value);
				}
			}
		};
		$.fx.step.height = function (fx) {
			$.cssHooks.height.set(fx.elem, fx.now + fx.unit);
		};

		$.cssHooks.backgroundPositionX = {
			set: function(elem, value, unit, isInternal) {
				if (elem.isVML) {
					if (typeof value === 'string') {
						value = Number(value.substr(0, value.length - 2));
					}
					var positionX = (value + 0.5) / $(elem).outerWidth(),
						positionY = elem.positionY;
					elem.positionX = positionX;
					elem.fill.position = [positionX, positionY];
				}
				if (!isInternal) {
					elem.style.backgroundPositionX = value + (unit ? unit : '');
				}
			}
		};
		$.fx.step.backgroundPositionX = function (fx) {
			$.cssHooks.backgroundPositionX.set(fx.elem, fx.now, fx.unit);
		};

		$.cssHooks.backgroundPositionY = {
			set: function(elem, value, unit, isInternal) {
				if (elem.isVML) {
					if (typeof value === 'string') {
						value = Number(value.substr(0, value.length - 2));
					}
					var positionX = elem.positionX,
						positionY = (value + 0.5) / $(elem).outerHeight();
					elem.positionY = positionY;
					elem.fill.position = [positionX, positionY];
				}
				if (!isInternal) {
					elem.style.backgroundPositionY = value + (unit ? unit : '');
				}
			}
		};
		$.fx.step.backgroundPositionY = function (fx) {
			$.cssHooks.backgroundPositionY.set(fx.elem, fx.now, fx.unit);
		};

	}

	_init();

//------------------------------------------------------------------------------------------------------------------
// PUBLIC METHODS
//------------------------------------------------------------------------------------------------------------------

	$.fn.vml = function () {
		if (_isTargetBrowser) {
			this.each(function (index, element) {
				_replaceWithVML(element);
			});
		}
		return this;
	};

})(jQuery);
