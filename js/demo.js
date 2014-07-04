(function($){
	function YeSlider(element,options){
		var self = this;
		self.slider = $(element);
		self.opts = $.extend({}, $.fn.yeSlider.defaults, options);
		self._isMove = self.opts.transitionType === 'slide' ? true : false;
		self._isHor = self.opts.slidesOrientation === 'horizontal' ? true : false;
		self._reorderProp = self._isHor ? 'left' : 'top';
		self._currAnimSpeed = self.opts.transitionSpeed;
		self._loop = self.opts.loop;
		self.ev = $({});
		if('ontouchstart' in window || 'createTouch' in document) {
			self.hasTouch = true;
			self._downEvent = 'touchstart.ye';
			self._moveEvent = 'touchmove.ye';
			self._upEvent = 'touchend.ye';
			self._cancelEvent = 'touchcancel.ye';
		} else {
			self.hasTouch = false;
			
			self._downEvent = 'mousedown.ye';
			self._moveEvent = 'mousemove.ye';
			self._upEvent = 'mouseup.ye';
			self._cancelEvent = 'mouseup.ye';
		}
		self.initSlidesData();
		
		//Timer
		self.opts.timer && self.addTimer();
		//AutoPlay
		self.opts.autoPlay && self._autoPlay();
		// resize
		var resizeTimer;
		
		$(window).resize(function() {	
			if(resizeTimer) {
				clearTimeout(resizeTimer);			
			}
			resizeTimer = setTimeout(function() { self.updateSize(); }, 60);			
		});	
		self.updateSize();
					
		//control Navigation thumbs or bullets...
		self.initControls();
		//Arrows
		self.opts.arrowsNav && self.setArrow();
					
		//Drag	
		self.opts.navigateByDrag && self._isMove && self.setDrag();
		
		//click
		self.opts.navigateByClick && self._mouseEvent();
		//keyboard
		self.opts.navigateByKeyboard && self._keyboard();
		
		self._bindMouseEvent();					
		
		self.ev.trigger('yeAfterInit');
		
	}
	YeSlider.prototype = {
		initSlidesData: function(){
			var self = this;
			self.slides = [];
			self.slidesJQ = [];
			var id = 0;	
			// For IE TextShadow
			$('.ye_caption_text').textShadow();
			self.slider.children().detach().each(function(){
				ct(this);
			});
			function ct(content){
				if($(content).hasClass('yeSliderBulletContainer')){
					self.slider.bulletContainer = $(content);
					return;
				}
				var obj = {},
					content = $(content);
					obj.id = id;
					obj.img = content.find('.yeImg');
					obj.iW = obj.img.attr('data-width');
					obj.iH = obj.img.attr('data-height');
					obj.image = obj.img.attr('src');
					obj.content = content;
					obj.video = content.attr('data-video');
					obj.caption = content.find('.ye_caption_text,.ye_caption_img, .ye_caption_video,.ye_caption_html').show();
					obj.captionVedio = content.find('.ye_caption_video');
					obj.delay = content.attr('ye-delay') ? content.attr('ye-delay'): self.opts.delay;
					obj.thumb = content.find('.yeThumb').detach();
					if(obj.video) {
						//obj.content.removeAttr('data-video');
						obj.content.append('<div class="yeVideoPlayBtn" data-index="'+id+'"></div>');
						obj.content.addClass('yeVideoContent');
						obj.video = self.getVideoIframe(obj.video);
					}
					if(obj.caption){
						for(var i = 0, len = obj.caption.length; i < len; i++){
							$(obj.caption[i]).attr('data-imgUrl',$(obj.caption[i]).find('img').attr('src'))
						}
					}
					
					/*if(obj.captionVedio){
						var _vedioUrl = obj.captionVedio.attr('data-videourl');
						obj.captionVedio.html(getVideoIframe(_vedioUrl));
					}*/
				var ht = $('<div class="yeSlide'+ (self._isMove ? '':' yeFade' + (id == 0 ? ' yeHere': ''))+ '"></div>');
					id++;		
					//self.ev.trigger('yeBeforeParseNode', [content, obj]);			
					self.slides.push(obj);
					self.slidesJQ.push(ht);
			}
			self.slider.html('<div class="yeOverflow"><div class="yeContainer"></div></div>');
			self.slider.css('height','100%');
			self._overflow = self.slider.children('.yeOverflow');
			self._container = self._overflow.children('.yeContainer');
			self._preloader = $("<div class='yePreloader'></div>");
			self._currId = 0;
			self.currSlide = self.slides[self._currId];
			self.prevSlide = false;
			self._num = self.slides.length;
			if(self._num < 2 ){
				self._loop = false;
				self.opts.arrowsNav = false;
				self.opts.navigateByDrag = false;
				//self.opts.navigateByClick = false;
			}
			self._realId = 0;
			
			self._initAnimationBlocks();						
		},
		_initAnimationBlocks: function(){
			var self = this;
				
			self.ev.on('initAnimateBlock.ye',function(e,obj){
				if(!obj.abs){
					obj.abs = obj.content.find('.yeABlock').css('opacity','0');
					if(obj.abs.length){
						obj.hasBlock = true;
						obj.abArray = [];
						$.each(obj.abs, function(i,value){
							getAnimObj($(value),obj);
						});
						if(!self._firstAb && obj == self.currSlide){
							self.ev.trigger('setBlocksAnimate.ye', self.currSlide);
							self._firstAb = true;
						}
					}else{
						obj.hasBlock = false;
					}
				}	
			});
			self.ev.on('setBlocksAnimate.ye',function(e,obj){		
				if(obj.hasBlock){
					if(!obj.abTimeouts) obj.abTimeouts = [];
					
					for(var i = 0; i < obj.abs.length; i++){
						obj.abTimeouts.push(setTimeout((function(index,animObj,animData){
							return function(){
								if(!self.isBlockFlag){
									$(animObj).animate(animData.animCss,animData.speed,animData.easing);
									delete obj.abTimeouts[index];
								}								
							}
						})(i, obj.abs[i], obj.abArray[i]), obj.abArray[i].delay));
					}					
				}
				
			});
			self.ev.on('stopBlocksAnimate.ye',function(e,obj){
				if(obj.hasBlock){
					
					if(obj.abTimeouts){
						for(var i = 0; i < obj.abTimeouts.length; i++){
							clearTimeout(obj.abTimeouts[i]);
						}
						obj.abTimeouts = null;
					}
					for(var i = 0; i < obj.abs.length; i++){
						var block = obj.abs[i];
						
						$(block).css(obj.abArray[i].newCss);						
						$(block).stop(true);	
						
					}
				}
				for(var i = 0, len = obj.captionVedio.length; i < len; i++){
					self.isVideoPlaying = false;
					$(obj.captionVedio[i]).html($('<img src="' + $(obj.captionVedio[i]).attr("data-imgUrl") +'"/><div class="ye_caption_vedioPlayBtn"></div>'));
				}
			});
			function getAnimObj(item,obj){
				var animObjDefaults = {
					moveDir : 'Top',
					delay : 100,
					easing : 'easeOutSine',
					isFade : true,
					speed : 1000,
					moveOffset : 100,
					opacity : 100
				}
				var animObj = obj.abs;
				var animcss = {},
					newcss = {};
				if(item.attr('move-dir')){
					animObjDefaults.moveDir = item.attr('move-dir');
				}
				if(item.attr('move-delay')){
					animObjDefaults.delay = item.attr('move-delay') * obj.delay;
				}
				if(item.attr('move-easing')){
					animObjDefaults.easing = item.attr('move-easing');
				}
				if(item.attr('move-speed')){
					animObjDefaults.speed = item.attr('move-speed') * obj.delay;
				}
				if(item.attr('move-distance') !=""){
					animObjDefaults.moveOffset = item.attr('move-distance');
				}
				if(item.attr('move-opacity')){
					animObjDefaults.opacity = item.attr('move-opacity');
				}
				var newObj = {};
				var realpos = parseInt(item.css('margin'+animObjDefaults.moveDir));
				if(isNaN(realpos)){
					realpos = 0;
				}
				var newpos = parseInt(realpos, 10) + parseInt(animObjDefaults.moveOffset, 10);
				if(animObjDefaults.moveDir =='Right'){
					animObjDefaults.moveDir = 'Left';
					newpos = -newpos;
				}
				if(animObjDefaults.moveDir =='Bottom'){
					animObjDefaults.moveDir = 'Top';
					newpos = -newpos;
				}
				animcss['opacity'] = animObjDefaults.opacity/100;
				animcss['margin'+animObjDefaults.moveDir] = realpos;
				
				
				newcss['opacity'] = '0';
				newcss['margin'+animObjDefaults.moveDir] = newpos;
				item.css('margin'+animObjDefaults.moveDir, newpos);
				animObjDefaults.animCss = animcss;
				animObjDefaults.newCss = newcss;
				obj.abArray.push(animObjDefaults);				
			}
		},
		_bindMouseEvent: function(){
			var self = this;
			self._container.on('stopAnimation.ye',function(){
				
				var ton = new Date().getTime();
				if(!self._TL){ self._TL = self.currSlide.delay - 100;}
				self._TL = self._TL-(ton - self._toff);
				if(self._autoPlayTimeout) {
					clearTimeout(self._autoPlayTimeout);
				}
				if(self._timer){
					self._timer.stop();
				}
				
				self._stopAnimOn = true;
				
			});
			self._container.on('continueAnimation.ye',function(){
				
				self._toff = new Date().getTime();
				self._timer.animate({
					'width' : '100%'
				},self._TL,function(){
					self._timer.css('width','0%');self.next();});
				self._stopAnimOn = false;
			});
		
			self._container.hover(
				function(){
					
					if(!self._stopAnimOn){
						var ton = new Date().getTime();	
						if(!self._TL){
							self._TL = self.currSlide.delay - 100;
						}
						self._TL = self._TL-(ton - self._toff);
						if(self._autoPlayTimeout) {
							clearTimeout(self._autoPlayTimeout);
						}
						if(self._timer){
							self._timer.stop(true);
						}
						if(self._TL > -100){
							self._stopAnimOn = true;	
						}						
						
					}			
				},
				function(){
					if(self._stopAnimOn && !self.isVideoPlaying){
						self._toff = new Date().getTime();					
						if(self._timer){
							self._timer.animate({
								'width' : '100%'
							},self._TL,'linear',function(){
								if(self.opts.autoPlay){
									//self._timer.css('width','0%');
									if(self._autoPlayTimeout){
										clearTimeout(self._autoPlayTimeout);
									}
									self._autoPlayTimeout = setTimeout(function(){
										self.next();
									}, 100);
								}
							});	
						}else{
							if(self.opts.autoPlay){
								if(self._autoPlayTimeout) {
									clearTimeout(self._autoPlayTimeout);
								}
								self._autoPlayTimeout = setTimeout(function() {
									self.next(true);						
								}, self._TL);
							}
							
						}
						
						self._stopAnimOn = false;					
					}					
				}
			);	
			self._container.on(self._downEvent, function(e){
				if(e.which != 1) return false;
				e.preventDefault();
				e.stopPropagation();//kk
				var target = $(e.target);
				if(target.hasClass('yeVideoPlayBtn')){
					self._ifDrag = false;
					var index = target.attr('data-index');
					var obj = self.slides[index];
					if(!obj.isVideoFinished){
						obj.videoHolder = $('<div class="yeVideoHolder"></div>').appendTo(obj.content);
						//obj.videoHolder.append(self._preloader);									
						obj.videoHolder.append(obj.video);
						obj.videoHolder.append('<div class="yeVideoClose" data-index="'+index+'"></div>');									
						obj.isVideoFinished = true;				
					}else{
						obj.videoHolder.appendTo(obj.content);		
					}						
					obj.video.css({
						width: '100%',
						height: '100%'
					});
					self.isVideoPlaying = true;
					self._timer.hide();
					return;
				}
				if(target.hasClass('ye_caption_vedioPlayBtn')){
					self.isVideoPlaying = true;
					self._ifDrag = false;
					var targetParent = target.parent();
					var _caption_video_url = targetParent.attr('data-videourl');
					targetParent.html(self._preloader);
					var _iframe = self.getVideoIframe(_caption_video_url);
					targetParent.html(_iframe);
					$(_iframe).css({
						width: '100%',
						height: '100%'
					});
										
					return;
				}
				if(target.hasClass('yeVideoClose')){
					self._ifDrag = false;
					var index = target.attr('data-index');
					var obj = self.slides[index];
					obj.videoHolder.detach();
					self.isVideoPlaying = false;
					self._timer.show();
					self._container.trigger('continueAnimation.ye');
					return;
				}	
				self._ifDrag = true;
				self._onX = e.pageX;
				self._beginX = parseInt(self._container.css('left'), 10);
				self._container.trigger('stopAnimation.ye');		
				self._stopAnimOn = false;	
			});
		},
		updateSize: function(){
			var self = this,
				newWidth,
				newHeight;
			newWidth = self.slider.width();
			newHeight = self.slider.height();
			if(self.opts.arrowSet){
				if(self.opts.arrowSet.leftPos.x < 0 ){
					newWidth = newWidth + self.opts.arrowSet.leftPos.x;
				}
				if(self.opts.arrowSet.rightPos.x < 0){
					newWidth = newWidth + self.opts.arrowSet.rightPos.x;
				}
			}
			if(newWidth != self.width || newHeight != self.height){
				self.width = newWidth;
				self.height = parseInt(newWidth * ( self.opts.autoHeight/self.opts.autoWidth ));
				if(self.opts.bulletSet){
					if(self.opts.bulletSet.y < 0){
						self.height = self.height + self.opts.bulletSet.y;
						
					}
				}
				if(self.opts.imageScaleMode == 'fit'){
					self._overflow.css({
						width: self.width,
						height: self.height
					});
				}
				if(self.opts.imageScaleMode == 'fill' && self.opts.autoSlideHeight){
					self._overflow.css({
						width: self.width
					});					
				}
				if(self.opts.imageScaleMode == 'fill' && !self.opts.autoSlideHeight){
					self._overflow.css({
						width: self.width,
						height: self.height
					});					
				}
				if(self.opts.arrowSet){
					if(self.opts.arrowSet.leftPos.x < 0 ){
						self._overflow.css('left', -1 * self.opts.arrowSet.leftPos.x);
					}
				}
				self._slideSize = self._isHor ? self.width : self.height;
				
				var item,
					slideItem,
					i,
					img;
				for(i = 0; i < self.slides.length; i++) {
					item = self.slides[i];
					item.positionSet = false;
					if(item && item.image && item.isLoaded) {
						item.isRendered = false;
						self._resize(item);
					} 
				}
				
				self._updateContent();
				
				if(self._isMove) {					
					self._container.css(self._reorderProp, (-self._realId ) * self._slideSize);
				}
				self.ev.trigger('updateControl.ye');
				self.ev.trigger('updateThumbsPosition.ye');
				//self._isMove && self.goTo(self._currId);
				
			}
		},
		_getCorrectLoopedId: function(index) {
			var self = this;
			if(self._loop) {
				if(index > self._num - 1) {
					return self._getCorrectLoopedId(index - self._num);
				} else  if(index < 0) {
					return self._getCorrectLoopedId(self._num + index);
				}
			}
			return index;
		},
		_updateContent: function(bt){
			var self = this,
				id = self._currId,
				num = self._num;
		
			var updateAfter = false;
			var updateBefore = false;
			if(!bt) {
				var min = self._getCorrectLoopedId(id - 1),
					max = self._getCorrectLoopedId(id + 1);
				
				var nmin = min > max ? 0 : min;
				var item;
				for (i = 0; i < num; i++) { 
					if(min > max && i > min - 1) {						
							continue;
					}
					if(i < nmin || i > max) {
						item = self.slides[i];
						if(item && item.holder) {						
							item.holder.detach();
							item.isAppended = false;
						}     
					}                               
			    }   
			}
			var tempId,
				groupOffset;
			for(i = id; i < id + 2; i++) {
				tempId = self._getCorrectLoopedId(i);
				item = self.slides[tempId];
				if(item && (!item.isAppended || !item.positionSet) ) {
					updateAfter = true;
					break;
				}
			}
			for(i = id - 1; i > id - 2; i--) {
				tempId = self._getCorrectLoopedId(i);
				item = self.slides[tempId];
				if(item && (!item.isAppended || !item.positionSet) ) {
					updateBefore = true;
					break;
				}
			}
			if(updateAfter) {
				for(i = id; i < id + 2; i++) {
					tempId = self._getCorrectLoopedId(i);
					groupOffset = Math.floor( (self._realId - (id - i)) / num) * num;
					item = self.slides[tempId];
					if(item) {
						updateItem(item, tempId);	
					}
				}
			}
			if(updateBefore) {
				for(i = id - 1; i > id - 2; i--) {
					tempId = self._getCorrectLoopedId(i);
					groupOffset = Math.floor( (self._realId - (id - i) ) / num) * num;
					item = self.slides[tempId];
					
					if(item) {
						updateItem(item, tempId);
					}
				}
			}
			function updateItem(item , i) {
				if(!item.isAppended) {					
					if(!item.holder) {						
						item.holder = self.slidesJQ[i];
					} 
					updatePos(i, item);
					addContent(i, item);
					self._container.append(item.holder);	
					item.isAppended = true;
				} else {
					addContent(i, item);
					updatePos(i, item);
				}
			}
			function addContent(i, item) {
				if(!item.slideLoaded) {
					self._slideImgLoad(item);
					if(!bt) {
						item.slideLoaded = true;
					}
					
				}
			}
			function updatePos(i, item) {
				if(self._isMove) {
					self.slidesJQ[i].css(self._reorderProp, (i + groupOffset) * self._slideSize);
				}
			}
		},
		_slideImgLoad: function(currSlideObject) {
			var self = this,
				content = currSlideObject.content,
				holder = currSlideObject.holder,
				unload_images_len = 0,
				lastImg;
			var onImageLoaded = function (slideObject) {
			    return function (e) {
			    	var content = slideObject.content,
			    		holder = slideObject.holder;
			    	
		    		var newImg = e.currentTarget;
		    		$(newImg).off('load');			    		
			    	
			    	if($(newImg).attr('src') == slideObject.image){
			    		if(!slideObject.iW){
								slideObject.iW = newImg.width;
								slideObject.iH = newImg.height;
							}
			    	}
			    	if($(newImg).attr('src') == $(lastImg).attr('src')){
			    		if(!slideObject.isLoaded) {	
				    		slideObject.isLoaded = true;
				    		self._resize( slideObject );
							self.ev.trigger('initAnimateBlock.ye',[slideObject]);
							slideObject.isLoading = false;
							if(e.type == 'error'){
								content = self._preloader;
							}
							
							holder.html(content);										
							slideObject.isRendered = true;		
							if(slideObject.id == self._currId){
								self.ev.trigger('yeAfterContentSet', slideObject);
							}						
						}
			    	}
			    };
			};
		
			if(!currSlideObject.isLoaded) {
				if(!currSlideObject.isLoading) {					
					currSlideObject.holder.html(self._preloader.clone());					
					currSlideObject.isLoading = true;
					
					var unload_images = currSlideObject.content.find('img');
					if(unload_images){
						unload_images_len = unload_images.length;
						lastImg = unload_images[unload_images_len-1];
						for(var i = 0; i < unload_images_len; i++){
							$("<img/>").one('load error',onImageLoaded(currSlideObject)).attr('src', $(unload_images[i]).attr('src'));
						}
					}
				}
			}			
		},
		_resize:function(slideObject) {
			var self = this;
			if(!slideObject.iW){
				slideObject.iW = self.opts.autoWidth;
				slideObject.iH = self.opts.autoHeight;
			}
			var	imgRatio = slideObject.iW/slideObject.iH,
				imgW = self.width,
				imgH = parseInt(imgW / imgRatio),
				ratio = self.width / slideObject.iW,
				ratioH = ratio,
				mleft = 0,
				mtop = 0,
				bmtop = 0;
				
			if(self.opts.imageScaleMode == 'fit'){
				if(imgH > self.height){
					imgH = self.height;
					imgW = parseInt(imgH * imgRatio);
					ratio = self.height /slideObject.iH;
					mleft = -imgW/2+self.width/2;
				}else{
					mtop = -imgH/2 + self.height/2;
					bmtop = (self.height - imgH) / 2;
				}
				if(imgW > slideObject.iW || imgH > slideObject.iH){
					imgH = slideObject.iH;
					imgW = slideObject.iW;
					ratio = 1;
					mleft = -imgW/2+self.width/2;
					mtop = -imgH/2 + self.height/2;
					bmtop = (self.height - imgH) / 2;
				}
				
			}
			
			slideObject.img.css({
				width: imgW,
				height: imgH,
				marginLeft: -imgW / 2,
				marginTop:  bmtop
			});
			if(self.opts.imageScaleMode == 'fill' && self.opts.autoSlideHeight){
				//ratio = self.width / slideObject.iw;
				if(slideObject.id == self._currId){
					//imgH = imgH.toFixed(2);
					imgH = parseInt(imgH);
					if(!self.moveHeight){
						self.moveHeight = imgH;
							self._overflow.animate({
								height: imgH
							},400);
					}
					if(self.moveHeight != imgH){
						self._overflow.animate({
							height: imgH
						},400);
						self.moveHeight = imgH;
					}									
				}				
			}
			if(self.opts.imageScaleMode == 'fill' && !self.opts.autoSlideHeight){
				slideObject.img.css({
					height: self.height
				});
				ratioH = self.height / slideObject.iH;
			}
			$.each(slideObject.caption, function(i, obj){
				var obj = $(obj),
					iw,
					ih,
					ix = parseInt(obj.attr('data-x'),10),
					iy = parseInt(obj.attr('data-y'),10),
					isize = parseInt(obj.attr('data-size'),10),
					ipadding = obj.attr('data-padding'),
					ipaddingTop,
					ipaddingRight,
					ipaddingBottom,
					ipaddingLeft,
					ilineHeight = parseInt(obj.attr('data-lineHeight'),10),
					iborderW = parseInt(obj.attr('data-borderWidth'),10);
				ilineHeight = ilineHeight ? ilineHeight : isize;
					
				if(ipadding && ipadding.split('-').length > 0){
					ipaddingTop = parseInt(ipadding.split('-')[0], 10);
					ipaddingRight = parseInt(ipadding.split('-')[1], 10);
					ipaddingBottom = parseInt(ipadding.split('-')[2], 10);
					ipaddingLeft = parseInt(ipadding.split('-')[3], 10);					
				}
				if(obj.attr('data-width') == 'auto'){
					obj.css('width', 'auto');					
				}else{
					iw = parseInt(obj.attr('data-width'),10) ? parseInt(obj.attr('data-width'),10) : parseInt(obj.css('width'),10);
					obj.css('width', iw * ratio);	
				}

				if(obj.attr('data-height') == 'auto'){
					obj.css('height', 'auto');					
				}else{
					ih = parseInt(obj.attr('data-height'),10)? parseInt(obj.attr('data-height'),10) : parseInt(obj.css('height'),10);
					obj.css('height', ih * ratio);	
				}

				obj.css({
					left: ix * ratio + mleft,
					top: iy * ratioH+ mtop,
					fontSize: isize * ratio,
					lineHeight: ilineHeight * ratio+'px',
					padding: ipadding * ratio,
					paddingTop: ipaddingTop * ratio,
					paddingRight: ipaddingRight * ratio, 
					paddingBottom: ipaddingBottom * ratio,
					paddingLeft: ipaddingLeft * ratio,
					borderWidth: iborderW * ratio
				});

				if(obj.attr('data-opacity')){
					obj.css('opacity', obj.attr('data-opacity')/100);
				}
			});
			self.ev.trigger('updateThumbsSize.ye');
		},
		setArrow: function(){
			var self = this;
			self.slider.append('<a class="yeArrow yeArrowLeft"></a><a class="yeArrow yeArrowRight"></a>');
			self._arrowLeft = self.slider.children('.yeArrowLeft');
			self._arrowRight = self.slider.children('.yeArrowRight');
			if(self.opts.arrowSet){
				if(self.opts.arrowSet.leftPos.x > 0){
					self._arrowLeft.css('left', 'auto');
					self._arrowLeft.css(self.opts.arrowSet.leftPos.xType, self.opts.arrowSet.leftPos.x);
				}else{
					self._arrowLeft.css(self.opts.arrowSet.leftPos.xType, 0);
				}
				if(self.opts.arrowSet.rightPos.x > 0){
					self._arrowRight.css('right', 'auto');
					self._arrowRight.css(self.opts.arrowSet.rightPos.xType, self.opts.arrowSet.rightPos.x);
				}else{
					self._arrowRight.css(self.opts.arrowSet.rightPos.xType, 0);
				}
				
				if(self.opts.arrowSet.leftPos.yType != 'center'){
					if(self.opts.arrowSet.leftPos.yType == 'bottom'){
						self._arrowLeft.css(self.opts.arrowSet.leftPos.yType, self.opts.arrowSet.leftPos.y);
						self._arrowLeft.css('top', 'auto');
						if(self.opts.bulletSet){
							if(self.opts.bulletSet.y < 0){
								self._arrowLeft.css(self.opts.arrowSet.leftPos.yType, self.opts.arrowSet.leftPos.y -1 * self.opts.bulletSet.y);
							}
						}
					}else{
						self._arrowLeft.css(self.opts.arrowSet.leftPos.yType, self.opts.arrowSet.leftPos.y);
					}					
					self._arrowLeft.css('marginTop',0);
				}else{
					self._arrowLeft.css({
						top: '50%'
					});
				}
				if(self.opts.arrowSet.rightPos.yType != 'center'){
					if(self.opts.arrowSet.rightPos.yType == 'bottom'){
						self._arrowRight.css(self.opts.arrowSet.rightPos.yType, self.opts.arrowSet.rightPos.y);
						self._arrowRight.css('top', 'auto');
						if(self.opts.bulletSet){
							if(self.opts.bulletSet.y < 0){
								self._arrowRight.css(self.opts.arrowSet.rightPos.yType, self.opts.arrowSet.rightPos.y -1 * self.opts.bulletSet.y);
							}
						}
					}else{
						self._arrowRight.css(self.opts.arrowSet.rightPos.yType, self.opts.arrowSet.rightPos.y);
					}
					
					self._arrowRight.css('marginTop',0);
				}else{
					self._arrowRight.css({
						top: '50%'
					});
				}
					
					
				
			}else{
				self._arrowLeft.css({
					left: '5px',
					marginTop: -1 * 25 + 'px',
					top: '50%'
				});
				self._arrowRight.css({
					right: '5px',
					marginTop: -1 * 25 + 'px',
					top: '50%'
				});
			}
			
			self._arrowLeft.click(function(e){
				e.preventDefault();
				if(!self._isAnimating){
					self.prev();
					self._mt = true;
				}
			});
			self._arrowRight.click(function(e){
				e.preventDefault();
				if(!self._isAnimating){
					self.next();
					self._mt = true;
				}
			});
			if(self.opts.arrowsNavAutoHide) {
				self._arrowLeft.addClass('yeHidden');
				self._arrowRight.addClass('yeHidden');
				
				self.slider.one(self._moveEvent,function() {
					self._arrowLeft.removeClass('yeHidden');
					self._arrowRight.removeClass('yeHidden');			
				});
				self.slider.hover(
					function() {
						if(!self._arrowsAutoHideLocked) {
							self._arrowLeft.removeClass('yeHidden');
							self._arrowRight.removeClass('yeHidden');
						}
					},
					function() {
						if(!self._arrowsAutoHideLocked) {
							self._arrowLeft.addClass('yeHidden');
							self._arrowRight.addClass('yeHidden');
						}
					}
				);	
			}	
		},
		prev: function(){
			var self = this;
			self._moveTo('prev');
		},
		next: function(){
			var self = this;
			self._moveTo('next');
		},
		_moveTo:function(type) {
			var self = this,
				newPos,
				difference,
				i;
			if(type === 'next') {
				newItemId = self._currId+1;
			} else if(type === 'prev') {
				newItemId = self._currId-1;
			} else{
				newItemId = type = parseInt(type,10);
			}
			if(!self._loop) {
				if(newItemId < 0 || newItemId >= self._num) {
					return;
				} 
			}
			if(self._autoPlayTimeout){
				clearTimeout(self._autoPlayTimeout);
			}
			self._isAnimating && self._stopAnimation();
			difference = newItemId - self._currId;
			var id = newItemId;
			var temp;
			var delayed;
			if(self._loop) {
				if(!isNaN(id)){
					id = self._getCorrectLoopedId(id);
				}				
				self._realId += difference;
			} else {
				self._realId = id;
			}
			self.ev.trigger('stopBlocksAnimate.ye',self.currSlide);
			self._oldHolder = self.slidesJQ[self._currId];
			self.prevSlide = self.slides[self._currId];
			self._currId = id;
			self.currSlide = self.slides[self._currId];
			self._currHolder = self.slidesJQ[self._currId];
			if(self.prevSlide.video){
				if(self.prevSlide.videoHolder){
					self.prevSlide.videoHolder.detach();
					self.isVideoPlaying = false;
					self._timer.show();
				}				
			}
	
			difference>0 && self._updateContent(true);
			newPos = (-self._realId) * self._slideSize;
		
			self._animateTo(newPos, type);
			
			self.ev.trigger('yeMove');			
		},
		goTo: function(id){
			var self = this;
			self._moveTo(id);
		},
		_animateTo: function(pos, dir) {
			var self = this,
				moveProp,
				oldBlock,
				animBlock;
			var animObj = {};
			self._sPosition = pos;
			//
			self.ev.trigger('updateControl.ye');			
			if(self._isMove) {
				animObj[self._reorderProp] = pos + 'px';
				self._container.animate(animObj, self._currAnimSpeed);
			} else {
				oldBlock = self._oldHolder;
				animBlock = self._currHolder;					
				animBlock.stop(true, true).css({
					opacity: 0,
					display: 'block',
					zIndex: 10
				});
				animBlock.animate({opacity: 1}, self._currAnimSpeed,'swing');
				if(self.fadeTimeout){
					clearTimeout(self.fadeTimeout);
				}
				self.fadeTimeout = setTimeout(function() {
						oldBlock.stop(true, true).css({
							opacity: 0,
							display: 'none',
							zIndex: 0
						});
					}, self._currAnimSpeed+60);
				
			}
			
			self._isAnimating = true;			
			self.loadingTimeout = setTimeout(function() {
					self.loadingTimeout = null;
					self._animationComplete(dir);
				}, self._currAnimSpeed + 60);			
		},
		_animationComplete: function(dir) {
			var self = this;
			
			if(!self._isMove) {
				self._currHolder.css('z-index', 0);
				self._fadeZIndex = 10;
			}
			self._isAnimating = false;
			
			self.staticSlideId = self._currId;
			self._updateContent();
			self._slidesMoved = false;
			self.ev.trigger('yeAfterSlideChange');
			self.ev.trigger('setBlocksAnimate.ye',[self.currSlide]);
			self.ev.trigger('updateThumbsPosition.ye');
			if(self.opts.autoSlideHeight && self.opts.imageScaleMode == 'fill'){
				var currSlideObject = self.slides[self._currId];
				var imgH = parseInt(self.width *currSlideObject.iH / currSlideObject.iW);
				
					self._overflow.animate({
						height: imgH
					},400)
				
				
			}
		},
		_stopAnimation: function() {
			var self = this;
			self._isAnimating = false;
			clearTimeout(self.loadingTimeout);
			if(self._isMove) {
				if(!self._useCSS3Transitions) {
					self._container.stop(true);
					self._sPosition = parseInt(self._container.css(self._reorderProp), 10);
				}
			} else {				
				if(self._fadeZIndex > 20) {
					self._fadeZIndex = 10;
				} else {
					self._fadeZIndex++;
				}
			}
		},
		_setPosition: function(pos) {
			var self = this;
			pos = self._sPosition = pos;
	
			self._container.css(self._reorderProp, pos);			
		},
		_getCSS3Prop: function(pos, hor) {
			var self = this;
			return self._useCSS3Transitions ? self._tPref1 + ( hor ? (pos + self._tPref2 + 0) : (0 + self._tPref2 + pos) ) + self._tPref3 : pos;
		},
		_updateAnimBlockProps: function(obj, props) {
			setTimeout(function() {
				obj.css(props);
			}, 6);
		},
		_autoPlay: function(){
			var self = this;
			self.ev.on('yeAfterContentSet yeAfterSlideChange',function(e,obj){
				self._toff = new Date().getTime();
				self._TL = self.currSlide.delay - 100;
				if(!self._isAnimating){
					if(self._autoPlayTimeout) {
						clearTimeout(self._autoPlayTimeout);
					}
					self._autoPlayTimeout = setTimeout(function() {
						self.next(true);						
					}, self.currSlide.delay);
				}
			});				
		},
		addTimer: function(){
			var self = this;
			if(!self._timer){
				self._timer = $('<div class="yeTimer"></div>').appendTo(self.slider);
			}
			
			self.ev.on('yeAfterSlideChange yeAfterContentSet',function(){
				self._toff = new Date().getTime();		
				self._TL = self.currSlide.delay - 100;	
				self._timer.animate({
					'width' : '100%'
				},self._TL,'linear',function(){
					//self._timer.css('width','0%');
				});
			});
			self.ev.on('yeMove',function(){
				self._timer.css('width','0%');
				self._timer.stop();
			});			
		},
		initControls: function(){
			var self = this;
			if(self.opts.controlType ==='bullets'){
				self.setBullets();
			}
			if(self.opts.controlType === 'thumbs'){
				self.setThumbs();
			}
		},
		setBullets: function(){
			var self = this;
			if(self.slider.bulletContainer){
				
				self.slider.append(self.slider.bulletContainer.html());
				self._bulletContainer = $('.yeslider-bulletNav');
				var aholder = $('.yeslider-bulletNavMiddle').find('a').remove();
				if(aholder){
					$('.yeslider-bulletNavMiddle').append(aholder.eq(0));
					self._bulletLeft = aholder.eq(0);
					self._bulletLeft.click(function(e){
						e.preventDefault();
						if(!self._isAnimating){
							self.prev();
							self._mt = true;
						}
					});
				}
				for(var i = 0; i < self._num; i++){
					$('.yeslider-bulletNavMiddle').append('<a class="bullet-control'+ (self._currId != i ? '' : ' active') +'">'+ (i+1) +'</a>');
				}
				if(aholder){
					$('.yeslider-bulletNavMiddle').append(aholder.eq(1));
					self._bulletRight = aholder.eq(1);
					self._bulletRight.click(function(e){
						e.preventDefault();
						if(!self._isAnimating){
							self.next();
							self._mt = true;
						}
					});
				}
				if(self.opts.bulletSet.xType == 'center'){
					$('.yeslider-bulletNav').css({
						left: '50%',
						marginLeft: parseInt($('.yeslider-bulletNav').css('width')) * (-1)/2
					});
				}else{
					if(self.opts.bulletSet.xType == 'left'){
						$('.yeslider-bulletNav').css(self.opts.bulletSet.xType, self.opts.bulletSet.x + parseInt(self._overflow.css('marginLeft')));
					}else{
						$('.yeslider-bulletNav').css(self.opts.bulletSet.xType, self.opts.bulletSet.x + parseInt(self._overflow.css('marginRight')));
					}
					
				}
				if(self.opts.bulletSet.y > 0){
					$('.yeslider-bulletNav').css(self.opts.bulletSet.yType, self.opts.bulletSet.y);
				}else{
					$('.yeslider-bulletNav').css(self.opts.bulletSet.yType, 0);
					if(self.opts.bulletSet.yType == 'bottom'){
						self._overflow.css('marginBottom', -1 * self.opts.bulletSet.y);
					}else{
						self._overflow.css('marginTop', -1 * self.opts.bulletSet.y);
					}
					
					
				}
				
				if(self.opts.bulletSet.y > 0) {
					self.opts.controlPosition = 'inside';
				}
				self._bullets = $('.yeslider-bulletNavMiddle').find('a.bullet-control');
				$.each(self._bullets, function(index, value){
					$(value).click(function(){
						
						if(index!=self._currId){
							self._bullets.removeClass('active');
							self.goTo(index);
							self._bullets.eq(index).addClass('active');
						}
						
					});
				});
				self.ev.on('updateControl.ye',function(){
					self._bullets.removeClass('active');
					self._bullets.eq(self._currId).addClass('active');
				});	
				
				
			}else{
				self._bulletContainer = $('<div class="yeBulletContainer"></div>').appendTo((self.opts.controlPosition == 'inside' ? self._overflow : self.slider));
				if(self.opts.controlPosition == 'outside'){
					self._bulletContainer.addClass('yeBulletOutside'); 
				} 
				for(var i = 0; i < self._num; i++){
					self._bulletContainer.append('<div class="yeBullet"></div>');
				}
				
				var ctl = (31*self._num - 8)/2;
				self._bulletContainer.width(31*(self._num));
				self._bulletContainer.css('marginLeft', -1*ctl);
				
				self._bullets = self._bulletContainer.children();
				self._bullets.eq(self._currId).addClass('yeBulletHere');
				if(self.opts.bulletSet.xType == 'right'){
					self._bulletContainer.css('left', 'auto');
				}
				if(self.opts.bulletSet.yType == 'top'){
					self._bulletContainer.css('bottom', 'auto');
				}
				if(self.opts.bulletSet.xType != 'center'){
					self._bulletContainer.css(self.opts.bulletSet.xType, self.opts.bulletSet.x);
					self._bulletContainer.css('marginLeft', 0);
				}				
				self._bulletContainer.css(self.opts.bulletSet.yType, self.opts.bulletSet.y);
				$.each(self._bulletContainer.children(),function(index, value){
					$(value).click(function(){
						
						if(index!=self._currId){
							self._bullets.removeClass('yeBulletHere');
							self.goTo(index);
						}
						
					});
				});
				self.ev.on('updateControl.ye',function(){
					self._bullets.removeClass('yeBulletHere');
					self._bullets.eq(self._currId).addClass('yeBulletHere');
				});	
			}
			
			
			if(self.opts.controlAutoHide && self.opts.controlPosition != 'outside') {
				self._bulletContainer.addClass('yeHidden');
				
				self.slider.one(self._moveEvent,function() {
					self._bulletContainer.removeClass('yeHidden');
				});
				self.slider.hover(
					function() {
						if(!self._controlsAutoHideLocked) {
							self._bulletContainer.removeClass('yeHidden');
						}
					},
					function() {
						if(!self._controlsAutoHideLocked) {
							self._bulletContainer.addClass('yeHidden');
						}
					}
				);	
			}
			
		},
		setThumbs: function(){
			var self = this,
				_thm;
			if(self.opts.thumbsContainerWidth < 0 || self.opts.thumbsContainerWidth >100){
				self.opts.thumbsContainerWidth = 100;
			}
			self._thmOverflow = $('<div class="yeThumbsOverflow"></div>').appendTo(self.opts.controlPosition === 'inside' ? self._overflow : self.slider);
			self._thmInside = self.opts.controlPosition === 'inside' ? true : false;
			self._thmInside ? self._thmOverflow.addClass('yeThumbsInside') : self._thmOverflow.addClass('yeThumbsOutside');
			self._thmContainer = $('<div></div>').appendTo(self._thmOverflow);
			if(!self._thmWidth){
				self._thmWidth = self.opts.thumbDefaults.width;
			}
			self._thmOverflow.css('width',self.opts.thumbsContainerWidth+'%');
			self._thmContainer.css({
				'width' : self._num * self._thmWidth,
				'position' : 'relative'
			});	
			var thmOfW = self._thmOverflow.width(),
				thmCw = self._num * self.opts.thumbDefaults.width;
			if(thmOfW > thmCw){
				self._thmOverflow.width(thmCw);
				self._thmtriggerMove = true;
			}
			self._thmOverflow.css('marginLeft', -1*(self._thmOverflow.width()/2));
			for(var i = 0; i < self._num; i++){
				_thm = self.slides[i].thumb;
				if(!_thm.length){
					_thm = self.slides[i].image;
				}else{
					_thm = _thm.attr('src');
				}
				self._thmContainer.append('<div class="yeThumb"><img src="'+ _thm +'"/></div>');
				//$('.yeThumb').show();
			}
			if(self.opts.controlAutoHide && self._thmInside) {
				self._thmOverflow.addClass('yeHidden');
				
				self.slider.one(self._moveEvent,function() {
					self._thmOverflow.removeClass('yeHidden');
				});
				self.slider.hover(
					function() {
						if(!self._controlsAutoHideLocked) {
							self._thmOverflow.removeClass('yeHidden');
						}
					},
					function() {
						if(!self._controlsAutoHideLocked) {
							self._thmOverflow.addClass('yeHidden');
						}
					}
				);	
			}
			self._thmOverflow.on(self._moveEvent, function(e){
				e.preventDefault();
				if(!self._thmtriggerMove){
					if(self._thmMoveTimeout){
						clearTimeout(self._thmMoveTimeout);
					}
					self._thmMoveTimeout = setTimeout(function(){
						var mouseLeft = e.clientX,
						cleft = self._thmOverflow.offset().left,
						posLeft = mouseLeft - cleft,
						cwidth = self._thmOverflow.width(),
						owidth = self._thmContainer.width(),
						ratio = posLeft/cwidth,
						lwidth = -1*ratio * (owidth - cwidth);
						self._thmContainer.stop();
						self._thmContainer.animate({'left': lwidth});
					},50)
				
				}
				
			});
			
			self._thmOverflow.hover(function(e){
				self._thmMove = true;
				//self._container.trigger('stopAnimation.ye');
			},function(e){	
				self._thmMove = false;
				
					self.ev.trigger('updateThumbsPosition.ye');
				
				
				//self._container.trigger('continueAnimation.ye');
			});
			$.each(self._thmContainer.children(), function(index,value){
				$(value).hover(function(){
					if(index!=self._currId){
						self._thmHoverId = index;
						$(this).css('opacity','1.0');
					}
				},function(){
					if(index!=self._currId){
						self._thmHoverId = -1;
						$(this).css('opacity','0.5');
					}
				});
				$(value).click(function(){
					if(index == self._currId) return;
					self.goTo(index);
					self._mt = true;
				});
			});
			self._thmContainer.children().css('opacity','0.5');
			self._thmContainer.children().eq(self._currId).css('opacity','1.0');
			self.ev.on('updateControl.ye',function(){
				self._thmOverflow.css('marginLeft',-1*(self._thmOverflow.width()/2));
				self._thmContainer.children().css('opacity','0.5');
				self._thmContainer.children().eq(self._currId).css('opacity','1.0');
				if(self._thmHoverId > -1){
					self._thmContainer.children().eq(self._thmHoverId).css('opacity','1.0');
				}
			});	
			self.ev.on('updateThumbsPosition.ye', function(){
				if(!self._thmMove && !self._thmtriggerMove){
					var _outLeftCenter = self._thmOverflow.offset().left + self._thmOverflow.width()/2;
					var _half = self._thmOverflow.width()/2;
					var _inLeftCenter = (self._currId + 0.5) * self._thmWidth;
					var _len = _half - _inLeftCenter,
						_len2 = self._thmOverflow.width() - self._thmContainer.width();
					if(_len < _len2) _len = _len2;
					if(_inLeftCenter > _half){
						self._thmContainer.animate({'left': _len});
					}else{
						self._thmContainer.animate({'left': 0});
					}
				}
				
			});	
			self.ev.on('updateThumbsSize.ye',function(){
				var ratio = self.width/self.opts.autoWidth;
				self._thmWidth = self.opts.thumbDefaults.width*ratio;
				self._thmHeight = self.opts.thumbDefaults.height*ratio;
				self._thmContainer.children().each(function(i,value){
					$(value).width(self._thmWidth);
					$(value).height(self._thmHeight);
				});
				var _len = self._num * self._thmWidth;
					_len = parseFloat(_len.toFixed(1)) + parseFloat(0.1);
				self._thmContainer.css({
					'width' : _len
				});	
				self._thmOverflow.css('width',self.opts.thumbsContainerWidth+'%');
				var thmOfW = self._thmOverflow.width(),
					thmCw = self._num * self._thmWidth;
				if(thmOfW > thmCw){
					self._thmOverflow.width(thmCw);
					self._thmtriggerMove = true;
				}
				self._thmOverflow.css('marginLeft', -1*(self._thmOverflow.width()/2));
				
			});	
		},
		setDrag: function(){
			var self = this;
			self._mouseEvent();
			$(document).on(self._moveEvent,function(e){
				e.preventDefault();
				if(self._ifDrag){
					self._moveX = e.pageX;
					var draglen = self._moveX - self._onX;
					
					var _containerLeft = parseInt(self._container.css('left'), 10);
						_containerLeft += draglen;
					if(!self._loop){
						var len = _containerLeft - self._beginX;
						if(self._currId == 0 && len > 0){
							self._ifDrag = false;
							_containerLeft = self._beginX;
						}
						if(self._currId == self._num -1 && len < 0){
							self._ifDrag = false;
							_containerLeft = self._beginX;
						}
					}
					self._container.css('left',_containerLeft);
					self._onX = e.pageX;
					self._draglen = draglen;
				}
			});			
		},		
		_mouseEvent: function(){
			var self = this;			
			//video
			
			self._container.on(self._upEvent,function(e){
				e.preventDefault();
				if(self._ifDrag && e.which == 1){
					self._ifDrag = false;
					self._endX = parseInt(self._container.css('left'), 10);
					var _len = self._endX - self._beginX;
					var len = Math.abs(_len);
					if(len !=0 && len < 30){
						self._container.animate({
							'left' : self._beginX
						},400);
						self._container.trigger('continueAnimation.ye');
						return;
					}
					if(_len > 0){
						self.prev();
					}else if(_len < 0){
						//self.next();
					}else{
						if(self.opts.navigateByClick) self.next();
					}
				}
			});
		},
		_keyboard: function(){
			var self = this;
			$(document).on('keydown',function(e){
				if(!self._isAnimating){
					if(e.keyCode == 37) {
						self.prev();
					}
					if(e.keyCode == 39){
						self.next();
					}
				}
			});
		},
		getVideoIframe: function(videoLink){
			var self = this;
			var regexYoutube = /(\?v=|\&v=|\/\d\/|\/embed\/|\/v\/|\.be\/)([a-zA-Z0-9\-\_]+)/,// /http\:\/\/www.youtube.com\/watch\?v=(.+)/i,
			    regexVimeo = /http(s)?:\/\/(www\.)?vimeo\.com\/(\d+)/i,
				youtubeIframe = '<iframe class="youtube-player" type="text/html" width="1000" height="522" src="http://www.youtube.com/embed/%id%?rel=1&autoplay=1&showinfo=0&autoplay=1&wmode=transparent" allowfullscreen frameborder="0">',
				vimeoIframe = '<iframe src="http://player.vimeo.com/video/%id%?byline=0&amp;portrait=0&amp;autoplay=1" frameborder="no" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
			
			if(regexYoutube.test(videoLink)){
				return $(youtubeIframe.replace('%id%',RegExp.$2));
			}
			if(regexVimeo.test(videoLink)){
				return $(vimeoIframe.replace('%id%',RegExp.$3));
			}			
		}
	};
	$.fn.yeSlider = function(options){
		var args = arguments;
		return this.each(function(){
			var self = $(this);
			if (typeof options === "object" ||  !options) {
				if( !self.data('yeSlider') ) {
					self.data('yeSlider', new YeSlider(self, options));
				}
			} else {
				var yeSlider = self.data('yeSlider');
				if (yeSlider && yeSlider[options]) {
					return yeSlider[options].apply(yeSlider, Array.prototype.slice.call(args, 1));
				}
			}
		});		
	};
	$.fn.yeSlider.defaults = {
		transitionSpeed: 400,
		delay: 5000,
		slidesOrientation: 'horizontal',
		transitionType: 'slide',
		loop: true,
		arrowsNav: true,
		arrowsNavAutoHide: true,
		autoWidth: 1222,
		autoHeight: 522,
		autoSlideHeight: true,
		autoPlay: false,
		timer: true,
		controlType: 'none', //bullets or  thumbs or none
		controlPosition: 'outside', //inside or outside
		controlAutoHide: true,
		navigateByDrag: false,
		navigateByClick: true,
		navigateByKeyboard: true,
		thumbDefaults: {
			width: 160,
			height: 90
		},
		imageScaleMode: 'fill', // Fill Or Fit
		thumbsContainerWidth: 60,  // 0~100
		arrowSet:{
			leftPos:{
				xType: 'left', //Left Arrow Horizontal Align  'left','right'
				x: 10,//Left Arrow Horizontal Position  
				yType: 'center',//Left Arrow Vertical Align  'center','top','bottom'
				y: 0//Left Arrow Vertical Position  
				
			},
			rightPos:{
				xType: 'right', //Right Arrow Horizontal Align  'left','right'
				x: 10,//Right Arrow Horizontal Position  
				yType: 'center',//Right Arrow Vertical Align  'center','top','bottom'
				y: 0//Right Arrow Vertical Position  
			}
		},
		bulletSet:{
			xType: 'center', //Bullet Container Horizontal Align  'center','left','right'
			x: 30,//Bullet Container Horizontal Align Position					
			yType: 'bottom',//Bullet Container Vertical Align  'top','bottom'
			y: 20//Bullet Container Vertical Align Position	
		}
	};	
})(jQuery);
