---
layout: post
title: js创建对象的几种模式
tags: js 笔记
---
<p>如果只是想简单的创建一个对象，只需用原生构造函数Object构建。</p>
{% highlight js linenos%}
var person = new Object();
person.name = 'janet';
person.age = '26';
person.sayName = function(){
	alert(this.name);
}
{% endhighlight %}
<p>用对象字面量语法可以写成:</p>
{% highlight js linenos%}
var person = {
	name: 'janet',
	age: 26,
	sayName: function(){
		alert(this.name);
	}
};
{% endhighlight %}

<p>但是如果想创建更多相似的对象呢？难道要重复写上面的代码吗？</p>
<p>可以用工厂模式来解决这个问题，这种模式抽象了创建具体对象的过程。</p>
{% highlight js linenos%}
//工厂模式
function createPerson(name, age){
	var o = {
		name: name,
		age: age,
		sayName: function(){
			alert(this.name);
		}
	};
	return o;
}
var person1 = createPerson('janet', 26),
	person2 = createPerson('joanna', 27);
{% endhighlight %}

<p>工厂模式有个问题就是不能识别对象类型,为了解决这个问题，我们可以使用构造函数模式。</p>
{% highlight js linenos%}
//构造函数模式
function Person(name, age){
	this.name = name;
	this.age = age;
	this.sayName = function(){
		alert(this.name);
	}
}
var person1 = new Person('janet', 26),
	person2 = new Person('joanna', 27);

	console.log(person1.constructor == Person); //true
	console.log(person2.constructor == Person); //true
{% endhighlight %}