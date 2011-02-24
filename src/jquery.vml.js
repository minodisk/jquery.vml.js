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
	var _ACTIVE_CLASS_NAME = _NAMESPACE + '_active';


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

		_isTargetBrowser = docMode && (docMode <= 8);
		if (_isTargetBrowser) {
			if (!doc.namespaces[_NAMESPACE]) {
				doc.namespaces.add(_NAMESPACE, 'urn:schemas-microsoft-com:vml');
			}
			var nodeNames = (docMode == 8) ? ['shape', 'fill'] : ['*'],
				selectors = [],
				i, len;
			for (i = 0,len = nodeNames.length; i < len; i++) {
				selectors[i] = _NAMESPACE + '\\:' + nodeNames[i];
			}
			$('head').prepend($('<style type="text/css">' + selectors.join(', ') + ' { behavior: url(#default#VML); }</style>'));

			_override();

			/*$(function () {
				// ':active' pseudo-classes doesn't work on relative positioned elements in IE.
				// Copy ':active' rule to style sheet as '.jquery_vml_js_active' class.
				var i, iLength, styleSheet, j, jLength, styleRule;
				for (i = 0,iLength = doc.styleSheets.length; i < iLength; i++) {
					styleSheet = doc.styleSheets[i];
					for (j = 0,jLength = styleSheet.rules.length; j < jLength; j++) {
						styleRule = styleSheet.rules[j];
						if (styleRule.selectorText.indexOf(':active') != -1) {
							styleSheet.addRule(styleRule.selectorText.replace(':active', ' .' + _ACTIVE_CLASS_NAME + ' '), styleRule.style.cssText);
						}
					}
				}
			});*/
		}
	}

	function _replaceWithVML(element) {
		if (element.nodeName == 'IMG') {
			_replaceImageNodeWithVML($(element));
		}
		else if (element.currentStyle.backgroundImage.toLowerCase().search(/(\.jpg|\.jpeg|\.png|\.gif)/) != -1) {
			_replaceBackgroundImageStyleWithVML($(element));
		}
	}

	function _replaceImageNodeWithVML($element) {
		$element.css('visibility', 'hidden');
		var $shape = _generateVML(true, $element, $element.attr('src'), $element.width(), $element.height());
		$element.before($shape);
		$shape.attr('fillcolor', 'none'); // Set 'fillcolor' after adding the shape to document, or it doesn't work.
	}

	function _replaceBackgroundImageStyleWithVML($element) {
		var backgroundImage = $element.css('backgroundImage');
		var src = backgroundImage.substr(5, backgroundImage.length - 7);
		$element.css('backgroundImage', 'none');
		//$element.css('backgroundImage', 'url(data:image/fig;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)');

		var position = $element.css('position');
		if (position != 'absolute') {
			$element.css('position', 'relative');
		}

		var $inner = $('<div></div>').css({
			position: 'relative',
			opacity: $element.css('opacity')
		});
		$element.wrapInner($inner);

		var $shape = _generateVML(
			false,
			$element, src,
			$element.outerWidth(),
			$element.outerHeight(),
			_getPosition($element.width(), $element.css('backgroundPositionX')),
			_getPosition($element.height(), $element.css('backgroundPositionY'))
			);

		$shape
			.css({
			         top: 0,
			         left: 0
			     });

		$element.prepend($shape);
		$shape.attr('fillcolor', 'none'); // Set 'fillcolor' after adding the shape to document, or it doesn't work.

		/*if ($element[0].tagName == 'A' && $element.css('cursor') == 'auto') {
			// 'cursor:auto' doesn't work on relative positioned elements in IE7.
			$element.css('cursor', 'pointer');
		}
		$element
			.bind('mouseenter', _onMouseEnterOrLeave)
			.bind('mouseleave', _onMouseEnterOrLeave)
			.bind('mousedown', _onMouseDown)
			.bind('mouseup', _onMouseUpOrBlur)
			.bind('blur', _onMouseUpOrBlur);/**/
	}

	function _onMouseEnterOrLeave(e) {
		var $element = $(this);
		_reflectFillPosition($element);
	}

	function _onMouseDown(e) {
		var $element = $(this);
		$element.addClass(_ACTIVE_CLASS_NAME);
		$element.focus();	// Doesn't focus on relative positioned elements in IE.
		_reflectFillPosition($element);
	}

	function _onMouseUpOrBlur(e) {
		var $element = $(this);
		$element.removeClass(_ACTIVE_CLASS_NAME);
		_reflectFillPosition($element);
	}

	function _reflectFillPosition($element) {
		// wait for next event loop
		setTimeout(function () {
			var width = $element.outerWidth();
			var height = $element.outerHeight();
			var x = _getPosition($element.width(), $element.css('backgroundPositionX'));
			var y = _getPosition($element.height(), $element.css('backgroundPositionY'));
			
			$($element[0].fill).attr('position', ((x + 0.5) / width).toString() + ',' + ((y + 0.5) / height).toString());
			$element[0].positionX = x;
			$element[0].positionY = y;
		}, 100);
	}

	function _generateVML(isImageNode, $element, src, width, height, x, y) {
		if (!x) {
			x = 0;
		}
		if (!y) {
			y = 0;
		}
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

		var $fill = $('<' + _NAMESPACE + ':fill />')
			.attr('src', src)
			.attr('type', isImageNode ? 'frame' : 'tile')
			//.attr('position', ((x + 0.5) / width).toString() + ',' + ((y + 0.5) / height).toString())
			.appendTo($shape);

		var opacity = $element.css('opacity');
		if ($element[0].isPNG = (src.search('.png') != -1)) {
			$fill.attr('opacity', opacity);
		}
		else {
			$shape.css('opacity', opacity);
		}
		$element.css('filter', 'none');
		$element[0].shape = $shape[0];
		$element[0].fill = $fill[0];
		$element[0].isVML = true;
		$element[0].isImageNode = isImageNode;

		$element.css({
			backgroundPositionX: x,
			backgroundPositionY: y
		});

		return $shape;
	}

	function _getPosition(size, posStr) {
		var ratio;
		switch (posStr) {
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
				if (posStr.search('%') != -1) {
					ratio = parseFloat(posStr) / 100;
				}
				break;
		}

		return (ratio) ? size * ratio : parseFloat(posStr);
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
						}
						else {
							return _getOpacityAsFilter(elem.shape, computed);
						}
					}
					else {
						return _getOpacityAsFilter(elem, computed);
					}
				},
				set: function(elem, value) {
					if (elem.isVML) {
						if (elem.isPNG) {
							elem.fill.opacity = value;
						}
						else {
							_setOpacityAsFilter(elem.shape, value);
						}
						if (!elem.isImageNode) {
							_setOpacityAsFilter(elem.childNodes[1], value);
						}
					}
					else {
						_setOpacityAsFilter(elem, value);
					}
				}
			};
		}

		$.cssHooks.left = {
			get: function (elem, computed) {
				if (elem.isVML && elem.isImageNode) {
					return elem.shape.style.left;
				}
				return elem.style.left;
			},
			set: function (elem, value) {
				if (elem.isVML && elem.isImageNode) {
					elem.shape.style.left = value;
				}
				elem.style.left = value;
			}
		};
		$.fx.step.left = function (fx) {
			$.cssHooks.left.set(fx.elem, fx.now + fx.unit);
		};

		$.cssHooks.top = {
			get: function (elem, computed) {
				if (elem.isVML && elem.isImageNode) {
					return elem.shape.style.top;
				}
				return elem.style.top;
			},
			set: function (elem, value) {
				if (elem.isVML && elem.isImageNode) {
					elem.shape.style.top = value;
				}
				elem.style.top = value;
			}
		};
		$.fx.step.top = function (fx) {
			$.cssHooks.top.set(fx.elem, fx.now + fx.unit);
		};

		var _super = {
			width: $.cssHooks.width,
			height: $.cssHooks.height
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
			set: function(elem, value, unit) {
				if (elem.isVML) {
					if (typeof value == 'string') {
						value = Number(value.substr(0, value.length - 2));
					}
					var positionX = (value + 0.5) / $(elem).outerWidth(),
						positionY = elem.positionY;
					elem.positionX = positionX;
					elem.fill.position = [positionX, positionY];
				}
				elem.style.backgroundPositionX = value + (unit ? unit : '');
			}
		};
		$.fx.step.backgroundPositionX = function (fx) {
			$.cssHooks.backgroundPositionX.set(fx.elem, fx.now, fx.unit);
		};

		$.cssHooks.backgroundPositionY = {
			set: function(elem, value, unit) {
				if (elem.isVML) {
					if (typeof value == 'string') {
						value = Number(value.substr(0, value.length - 2));
					}
					var positionX = elem.positionX,
						positionY = (value + 0.5) / $(elem).outerHeight();
					elem.positionY = positionY;
					elem.fill.position = [positionX, positionY];
				}
				elem.style.backgroundPositionY = value + (unit ? unit : '');
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
