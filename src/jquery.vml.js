/*!
 * jQuery vml Plugin v0.0.4.scaling
 * https://github.com/minodisk/jquery.vml.js
 *
 * Copyright (c) 2011 Daisuke MINO
 * Licensed under the MIT license.
 * https://github.com/minodisk/jquery.vml.js/raw/master/MIT-LICENSE
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

	var _isTargetBrowser,
		_hasLayoutProblem;


	//------------------------------------------------------------------------------------------------------------------
	// PRIVATE METHODS
	//------------------------------------------------------------------------------------------------------------------

	function _init() {
		var doc = document;
		_isTargetBrowser = (doc.documentMode) ? doc.documentMode <= 8 : /*@cc_on!@*/false;

		if (_isTargetBrowser) {
			_hasLayoutProblem = (doc.documentMode) ? doc.documentMode <= 7 : true;

			if (!doc.namespaces[_NAMESPACE]) {
				doc.namespaces.add(_NAMESPACE, 'urn:schemas-microsoft-com:vml');
			}
			var nodeNames = (doc.documentMode == 8) ? ['shape', 'fill'] : ['*'];
			$('head')
				.prepend($('<style type="text/css">' +
				_generateSelector(nodeNames) + ' { behavior: url(#default#VML); }' +
				'</style>'));

			_override();

			$(function () {
				// ':active' pseudo-classes doesn't work on relative positioned elements in IE.
				// Copy ':active' rule to style sheet as '.xml2vml_active' class.
				var i, iLength, styleSheet, j, jLength, styleRule;
				for (i = 0,iLength = doc.styleSheets.length; i < iLength; i++) {
					styleSheet = doc.styleSheets[i];
					for (j = 0,jLength = styleSheet.rules.length; j < jLength; j++) {
						styleRule = styleSheet.rules[j];
						if (styleRule.selectorText.indexOf(':active') != -1) {
							styleSheet.addRule(styleRule.selectorText.replace(':active', '.' + _ACTIVE_CLASS_NAME), styleRule.style.cssText);
						}
					}
				}
			});
		}
	}

	function _generateSelector(nodeNames) {
		var selectors = [];
		for (var i = 0, length = nodeNames.length; i < length; i++) {
			selectors[i] = _NAMESPACE + '\\:' + nodeNames[i];
		}
		return selectors.join(', ');
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
			$element.width() + parseInt($element.css('paddingLeft')) + parseInt($element.css('paddingRight')),
			$element.height() + parseInt($element.css('paddingTop')) + parseInt($element.css('paddingBottom')),
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

		if ($element[0].tagName == 'A' && $element.css('cursor') == 'auto') {
			// 'cursor:auto' doesn't work on relative positioned elements in IE7.
			$element.css('cursor', 'pointer');
		}
		$element
			.bind('mouseenter', _onMouseEnterOrLeave)
			.bind('mouseleave', _onMouseEnterOrLeave)
			.bind('mousedown', _onMouseDown)
			.bind('mouseup', _onMouseUpOrBlur)
			.bind('blur', _onMouseUpOrBlur);
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
		// Wait for reflecting style.
		setTimeout(function () {
			var width = $element.width() + parseInt($element.css('paddingLeft')) + parseInt($element.css('paddingRight'));
			var height = $element.height() + parseInt($element.css('paddingTop')) + parseInt($element.css('paddingBottom'));
			var x = _getPosition($element.width(), $element.css('backgroundPositionX'));
			var y = _getPosition($element.height(), $element.css('backgroundPositionY'));
			$($element[0].fill).attr('position', ((x + 0.5) / width).toString() + ',' + ((y + 0.5) / height).toString());
		}, 0);
	}

	function _generateVML(isImageNode, $element, src, width, height, x, y) {
		if (!x) {
			x = 0;
		}
		if (!y) {
			y = 0;
		}

		var opacity = $element.css('opacity');

		var $shape = $('<' + _NAMESPACE + ':shape />')
			.width(width)
			.height(height)
			.css('position', 'absolute')
			.attr('coordorigin', '1,1')
			.attr('coordsize', (width * 2).toString() + ',' + (height * 2).toString())
			.attr('path',
				'm 0,0 l ' +
				(width * 2).toString() + ',0, ' +
				(width * 2).toString() + ',' + (height * 2).toString() + ', ' +
				'0,' + (height * 2).toString() +
				' x e'
			)
			.attr('stroked', 'false')
			.attr('filled', 'true');

		var $fill = $('<' + _NAMESPACE + ':fill />')
			.attr('src', src)
			.attr('type', isImageNode ? 'frame' : 'tile')
			.attr('position', ((x + 0.5) / width).toString() + ',' + ((y + 0.5) / height).toString())
			.appendTo($shape);

		if (src.search('.png') != -1) {
			$element[0].isPNG = true;
			$fill.attr('opacity', opacity);
		}
		else {
			$element[0].isPNG = false;
			$shape.css('opacity', opacity);
		}
		$element.css('filter', 'none');

		$element[0].shape = $shape[0];
		$element[0].fill = $fill[0];
		$element[0].isVML = true;
		$element[0].isImageNode = isImageNode;

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
		// Override opacity
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

		// Override left
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

		// Override top
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

		// Override width
		/*$.cssHooks.top = {
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
		};*/
	}

		var cssHooksWidth = $.cssHooks.width;
		$.cssHooks.width = {
			get: function( elem, computed, extra ) {
				if (elem.isVML) {
					return elem.shape.style.width;
				} else {
					return cssHooksWidth.get( elem, computed, extra );
				}
			},

			set: function( elem, value ) {
				if (elem.isVML) {
					elem.shape.style.width = value;
				} else {
					return cssHooksWidth.set( elem , value );
				}
			}
		};
		$.fx.step.width = function (fx) {
			$.cssHooks.width.set(fx.elem, fx.now + fx.unit);
		};

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
