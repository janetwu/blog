---
layout: post
title: 用jekyll搭建博客
tags: jekyll
---

<p>刚开始想用jekyll搭建一个blog，完全是好奇贪图新鲜，心想玩玩呗。</p>
<p>大概列了一些我想要实现的功能：</p>
<ul>
	<li>文章评论功能</li>
	<li>标签云tag cloud</li>
	<li>代码高亮highlight</li>
	<li>文章read more功能</li>
	<li>首页文章置顶</li>
</ul>
<p>前面三个功能搜索一下可以很快找到实现方法。</p>
<p>而文章read more功能不是一下子就能找到如何实现的方法，这里分享一下： </p>
<p><a href="http://truongtx.me/2013/05/01/jekyll-read-more-feature-without-any-plugin/">http://truongtx.me/2013/05/01/jekyll-read-more-feature-without-any-plugin/</a></p>
<p>最后文章置顶功能，是找也找不到，唯有自己想办法解决。</p>
<p>既然头信息可以创建自定义变量，那可不可以通过创建一个变量来识别是否是篇需要置顶的文章呢？</p>
<p>在我想置顶的文章头部增加一个变量sticky，通过它来标志这是否是篇想要置顶的文章。</p>
{% highlight text linenos%}
---
layout: post
image: /img/yunnan/
title: 云南跨年游
tags: travel 云南
sticky: true
---
{% endhighlight %}
<p>在首页，我通过变量sticky来拿到post。</p>
{% highlight text linenos%}
{% raw %}
{% assign post = site.posts.first %}
{% assign content = post.content %}
{% for post in site.posts %}
  {% if post.sticky %}
      {% assign post = post %}
      {% assign content = post.content %}
      {% break %}
  {% endif %}
{% endfor %}
{% endraw %}
{% endhighlight %}
<p>and it works</p>
