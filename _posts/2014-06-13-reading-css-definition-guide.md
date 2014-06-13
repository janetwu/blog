---
layout: post
title: 看《CSS权威指南》一点小感悟
tags: css
pgyments: true
---
<blockquote>
	<p>
		在研究CSS的过程中，你可能会发现用户代理有一些看上去很奇怪的行为。如果全面地掌握了CSS中视觉表现引擎是如何工作的，你就能确定一种行为到底是CSS所定义表现引擎的正确结果，还是一个需要报告的bug。
	</p>
</blockquote>
<p>最近在看《CSS权威指南》，读到这段话，深有体会。</p>
<p>之前，我会尝试给一个行内非替换元素span一个垂直外边距，因为我可能想让span里的文本往下一些。但是不管我怎么设置，span里的文本还是原处不动，后来我试图寻求垂直内边距的帮助，但和外边距一样，文本还是原处不动，最后我再试试使用line-height，ok，文本可以动了，但是，边距为什么不ok呢？是不是浏览器有问题？换个浏览器试试？</p>
<p>如果不知道CSS中视觉表现引擎是如何工作的，不知道它对待块级元素和行内元素的具体区别，确实容易产生混乱，甚至觉得这些行为真是莫名奇怪。</p>
<p>对于块级元素和行内元素，最基本的认识就是一个换行一个不换行。但是，它们的差别不仅仅是如此。相对于块级元素，要了解行内元素的布局，需要知道更多的概念，例如行内框和行框。行内替换元素和行内非替换元素在处理上又不同，看上去，这么多概念，好像很复杂，但是，如果好好研究这些概念并且应用，就会发现，它们都是出于需求而出现的。</p>

<p>举个例子，看到以下的CSS，或许会问，box-sizing 到底是神马？</p>
{% highlight css linenos%}
*{
	-webkit-box-sizing: border-box;
	-moz-box-sizing: border-box;
	box-sizing: border-box;
}
*:before,
*:after {
	-webkit-box-sizing: border-box;
	-moz-box-sizing: border-box;
	box-sizing: border-box;
}
{% endhighlight %}
<p>box-sizing 在CSS2.1中尚未定义，是CSS3定义的新属性。</p>
<p>在CSS2.1中，width和height设置的只是元素内容框的宽度和高度。假设我们想要一个两列等宽自适应布局，可以分别设置这两列width为50%，这样，不管浏览器窗口多宽，这两列都等比例宽。但是，如果我们给这两栏设置边宽border，那么这两栏就会不再在同一行中了，因为border占位，而两栏的内容框宽度占位总和是100%，所以一行中没有足够地方同时放这两栏，只能换行了。</p>
<p>可不可以让width设置的不仅是内容框的宽度，连border也包括进去？这样问题不就可以解决了吗。</p>
<p>终于，box-sizing在CSS3中登场了，如果设置为border-box的话，width设置的就包含border，padding和content的总和width。</p>
<p>如果遇到一个新属性，想一想它是为何存在的以及能解决什么或者能改善什么，这样学习起来头脑会清晰多。</p>