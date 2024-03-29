// (C) 2008 henrik.lindqvist@llamalab.com

(function(ap){if(!ap.every){ap.every=function(fn,thisp){for(var i=0,l=this.length;--l>=0;i++)
if(i in this&&!fn.call(thisp,this[i],i,this))return false;return true;};}
if(!ap.filter){ap.filter=function(fn,thisp){var r=[];for(var v,i=0,l=this.length;--l>=0;i++)
if(i in this&&fn.call(thisp,v=this[i],i,this))r.push(v);return r;};}
if(!ap.forEach){ap.forEach=function(fn,thisp){for(var i=0,l=this.length;--l>=0;i++)
if(i in this)fn.call(thisp,this[i],i,this);};}
if(!ap.indexOf){ap.indexOf=function(e,i){var l=this.length;i=(i<0)?Math.ceil(i):Math.floor(i);if(i<0)i+=l;for(;i<l;i++)
if(i in this&&this[i]===e)return i;return-1;};}
if(!ap.lastIndexOf){ap.lastIndexOf=function(e,i){var l=this.length;if(isNaN(i))i=l-1;else{i=(i<0)?Math.ceil(i):Math.floor(i);if(i<0)i+=l;else if(i>=l)i=l-1;}
for(;i>-1;i--)
if(i in this&&this[i]===e)return i;return-1;};}
if(!ap.map){ap.map=function(fn,thisp){var l=this.length;var r=new Array(l);for(var i=0;--l>=0;i++)
if(i in this)r[i]=fn.call(thisp,this[i],i,this);return r;};}
if(!ap.some){ap.some=function(fn,thisp){for(var i=0,l=this.length;--l>=0;i++)
if(i in this&&fn.call(thisp,this[i],i,this))
return true;return false;};}})(Array.prototype);