---
layout: post
title: jQuery页面返回顶部效果实现
tags: jQuery CSS3
---
<p>一直想实现页面返回顶部效果，因为博客有些文章确实比较长需要这个小功能，终于有空给它加上了。</p>
<h2>HTML:</h2>
{% highlight html linenos%}
<a id="scrolltop">
	<span class="icon">
	  <i class="upArrow"></i>
	</span>
</a>
{% endhighlight %}
<h2>CSS:</h2>
<p>向上箭头是用CSS3实现的，不是一张图片，我可以说我不能马上找到满意的图片才这么做的吗，想要什么颜色随你便。</p>
{% highlight css linenos%}
#scrolltop{
	display: none;
	background-color: rgba(0,0,0,0.3);
	border-radius: 4px;
	position: fixed;
	bottom: 20px;
	right: 20px;
	cursor: pointer;
	-webkit-transition: background-color 0.5s ease;
    -moz-transition: background-color 0.5s ease;
    -o-transition: background-color 0.5s ease;
    transition: background-color 0.5s ease;
}
#scrolltop:hover{
	background-color: rgba(225,53,141,0.8);
}
span.icon {
	height: 32px;
	width: 32px;
	position: relative;
	margin: 8px 8px 3px;
	overflow: hidden;
	display: inline-block;
}
i.upArrow {
	height: 0px;
	width: 0px;
	border-width: 16px;
	border-style: solid;
	border-color: transparent transparent #fff transparent;
	position: absolute;
	bottom: 16px;
	left: 0;
}
i.upArrow:after {
	content: '';
	width: 12px;
	height: 16px;
	background-color: #fff;
	position: absolute;
	top: 16px;
	right: -6px;
}
{% endhighlight %}
<h2>JS:</h2>
<p>我也是从别人copy过来的代码，但是优化了一下，1）缓存多次用到的数据 2）window scroll事件加了延时处理。</p>
{% highlight javascript linenos%}
var $scrolltopBtn = $('#scrolltop'),
    _timeoutId;
$(window).scroll(function () {
  if(_timeoutId){
    clearTimeout(_timeoutId);
  }
  _timeoutId =  setTimeout(function(){
      if ($(this).scrollTop() > 100) {
        $scrolltopBtn.fadeIn();
      } else {
        $scrolltopBtn.fadeOut();
      }
    }, 100);
});
$scrolltopBtn.click(function () {
  $('body,html').animate({
    scrollTop: 0
  }, 800);
  return false;
});
{% endhighlight %}


