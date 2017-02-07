var Crop = function(config) {
	var defaultConfig = {
		boxSize: 500,
		showSize: {
			'circle': [100],
			'square': [100, 200]
		}
	};

	config = config || {};

	for(let props in defaultConfig) {
		if(config[props] === undefined) {
			config[props] = defaultConfig[props];
		}
	}

	this.scale = {};
	this.init(config);
};

Crop.prototype.init = function(config) {
	var cropDemoBox = document.getElementById('crop-demo-box'),
		cropSection = cropDemoBox.getElementsByClassName('crop-section')[0],
		previewSection = cropDemoBox.getElementsByClassName('preview-section')[0];

	this.style(cropSection, previewSection, config);
	this.position(cropSection);
	this.show(cropSection, previewSection, config.showSize);
	this.resize(cropSection, previewSection, config.showSize);
	this.move(cropSection, previewSection);
};

Crop.prototype.style = function(box, show, config) {
	box.style.cssText = 'width:' + config.boxSize + 'px;height:' + config.boxSize + 'px;';

	var {circle, square} = config.showSize,
		circleNum = circle.length,
		squareNum = square.length,
		append = '';

	var src = box.getElementsByClassName('crop-preview')[0].src;

	for(let i = 0; i < circleNum; i++) {
		let length = circle[i];
		append += `<div class="preview-frame circle-preview" style="width:${length}px;height:${length}px"><img src="${src}"></div><div class="show-size">${length}x${length}</div>`;
	}
	for(let i = 0; i < squareNum; i++) {
		let length = square[i];
		append += `<div class="preview-frame square-preview" style="width:${length}px;height:${length}px"><img src="${src}"></div><div class="show-size">${length}x${length}</div>`;
	}

	show.innerHTML = append;
};

Crop.prototype.show = function(box, show, showSize) {
	var image = box.getElementsByClassName('crop-preview')[0],
		scale = {};

	image.addEventListener('load', () => {
		var imageWidth = parseInt(window.getComputedStyle(image).width),
			targetContainer = box.getElementsByClassName('target-container')[0],
			targetContainerWidth= parseInt(window.getComputedStyle(targetContainer).width),
			circle = show.getElementsByClassName('circle-preview'),
			square = show.getElementsByClassName('square-preview');

		for(let key in showSize) {
			scale[key] = [];
			for(let i = 0; i < showSize[key].length; i++) {
				scale[key][i] = showSize[key][i]/targetContainerWidth;
			}
		}

		for(let i = 0; i < circle.length; i++) {
			circle[i].getElementsByTagName('img')[0].style.width = scale.circle[i] * imageWidth + 'px';
		}
		for(let i = 0; i < square.length; i++) {
			square[i].getElementsByTagName('img')[0].style.width = scale.square[i] * imageWidth + 'px';
		}
	});

	this.scale = scale;
};

Crop.prototype.position = function(box) {
	var image = box.getElementsByClassName('crop-preview')[0];

	image.addEventListener('load', () => {
		var boxLength = window.getComputedStyle(box).width,
			previewPane = box.getElementsByClassName('preview-pane')[0],
			targetBox = box.getElementsByClassName('target-box')[0],
			target = box.getElementsByClassName('target')[0],
			imageCssStyle = window.getComputedStyle(image),
			HeightIsLonger = parseInt(imageCssStyle.height) > parseInt(imageCssStyle.width),
			imageMaxBorder = HeightIsLonger? 'height': 'width',
			moveBorder = HeightIsLonger? 'width': 'height',
			marginBorder = HeightIsLonger? 'marginLeft': 'marginTop',
			marginLength = 0;

		image.style[imageMaxBorder] = target.style[imageMaxBorder] =  boxLength;
		marginLength = (parseInt(boxLength) - parseInt(imageCssStyle[moveBorder])) / 2 + 'px';
		targetBox.style[marginBorder] = marginLength;
		previewPane.style[marginBorder] = marginLength;
	});
};

Crop.prototype.move = function(box, show) {
	var targetBox = box.getElementsByClassName('target-box')[0],
		target = box.getElementsByClassName('target')[0],
		preview = box.getElementsByClassName('crop-preview')[0],
		circle = show.getElementsByClassName('circle-preview'),
		square = show.getElementsByClassName('square-preview');

	var self = this,
		scale;

	targetBox.addEventListener('mousedown', mouseDownHandler);

	function mouseDownHandler(e) {
		e.preventDefault();

		scale = self.scale;

		this.left = this.left? parseInt(this.style.left): 0;
		this.top = this.top? parseInt(this.style.top): 0;

		this.offsetX = e.clientX - this.left,
		this.offsetY = e.clientY - this.top;

		this.addEventListener('mousemove', mouseMoveHandler);
		document.addEventListener('mouseup', mouseUpHandler);
	}

	function mouseMoveHandler(e) {
		e.preventDefault();

		this.left = e.clientX - this.offsetX;
		this.top = e.clientY - this.offsetY;

		var previewCssStyle = window.getComputedStyle(preview),
			eleCssStyle = window.getComputedStyle(this),
			minLeft = 0
			maxLeft = parseInt(previewCssStyle.width) - parseInt(eleCssStyle.width),
			minTop = 0,
			maxTop = parseInt(previewCssStyle.height) - parseInt(eleCssStyle.height);

		if(this.left < minLeft) {
			this.left = minLeft;
		}
		if(this.left > maxLeft) {
			this.left = maxLeft;
		}

		if(this.top < minTop) {
			this.top = minTop;
		}
		if(this.top > maxTop) {
			this.top = maxTop;
		}
		
		this.style.left = this.left + 'px';
		this.style.top = this.top + 'px';
		target.style.left = -this.left + 'px';
		target.style.top = -this.top + 'px';

		for(let i = 0; i < circle.length; i ++) {
			circle[i].getElementsByTagName('img')[0].style.marginLeft = -this.left * scale.circle[i] + 'px';
			circle[i].getElementsByTagName('img')[0].style.marginTop = -this.top * scale.circle[i] + 'px';
		}
		for(let i = 0; i < square.length; i ++) {
			square[i].getElementsByTagName('img')[0].style.marginLeft = -this.left * scale.square[i] + 'px';
			square[i].getElementsByTagName('img')[0].style.marginTop = -this.top * scale.square[i] + 'px';
		}
	}

	function mouseUpHandler() {
		targetBox.removeEventListener('mousemove', mouseMoveHandler);
		document.removeEventListener('mouseup', mouseUpHandler);
	}
};

Crop.prototype.resize = function(box, show, showSize) {
	var targetResize = box.getElementsByClassName('target-resize')[0],
		targetBox = box.getElementsByClassName('target-box')[0],
		targetContainer = box.getElementsByClassName('target-container')[0],
		preview = box.getElementsByClassName('crop-preview')[0],
		circle = show.getElementsByClassName('circle-preview'),
		square = show.getElementsByClassName('square-preview');

	var boxCssStyle = window.getComputedStyle(targetBox);

	var self = this;

	targetResize.addEventListener('mousedown', mouseDownHandler);

	function mouseDownHandler(e) {
		e.preventDefault();
		e.stopPropagation();

		this.left = e.clientX;
		this.top = e.clientY;
		this.width = parseInt(boxCssStyle.width);
		this.height = parseInt(boxCssStyle.height);
		
		document.addEventListener('mousemove', mouseMoveHandler);
		document.addEventListener('mouseup', mouseUpHandler);
	}

	function mouseMoveHandler(e) {
		e.preventDefault();

		var offsetX = e.clientX - targetResize.left,
			offsetY = e.clientY - targetResize.top;

		var previewCssStyle = window.getComputedStyle(preview),
			previewWidth = parseInt(previewCssStyle.width),
			previewHeight = parseInt(previewCssStyle.height),
			boxLeft = parseInt(boxCssStyle.left),
			boxTop = parseInt(boxCssStyle.top),
			offsetWidth = previewWidth - parseInt(boxCssStyle.left),
			offsetHeight = previewHeight - parseInt(boxCssStyle.top),
			maxLength = offsetWidth > offsetHeight? offsetHeight: offsetWidth,
			minLength = maxLength * 0.2,
			scale = {};

		var width = targetResize.width + offsetX,
			height = targetResize.height + offsetY,
			length = 0;

		length = (width >= height? width: height);

		if(length < minLength) {
			length = minLength;
		} else if(length > maxLength) {
			length = maxLength;
		}

		for(let key in showSize) {
			scale[key] = [];
			for(let i = 0; i < showSize[key].length; i++) {
				scale[key][i] = showSize[key][i]/length;
			}
		}

		targetBox.style.width = targetBox.style.height = length + 'px';

		for(let i = 0; i < circle.length; i++) {
			circle[i].getElementsByTagName('img')[0].style.width = scale.circle[i] * previewWidth + 'px';
			circle[i].getElementsByTagName('img')[0].style.marginLeft = -scale.circle[i] * boxLeft + 'px';
			circle[i].getElementsByTagName('img')[0].style.marginTop = -scale.circle[i] * boxTop + 'px';
		}
		for(let i = 0; i < square.length; i++) {
			square[i].getElementsByTagName('img')[0].style.width = scale.square[i] * previewWidth + 'px';
			square[i].getElementsByTagName('img')[0].style.marginLeft = -scale.square[i] * boxLeft + 'px';
			square[i].getElementsByTagName('img')[0].style.marginTop = -scale.square[i] * boxTop + 'px';
		}

		self.scale = scale;
	}

	function mouseUpHandler() {
		document.removeEventListener('mousemove', mouseMoveHandler);
		document.removeEventListener('mouseup', mouseUpHandler);
	}
};