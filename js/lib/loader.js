
var ImageLoader = JAK.ClassMaker.makeClass({
	NAME : 'ImageLoader',
	VERSION : '1.0',
	IMPLEMENT : JAK.ISignals
});

ImageLoader.prototype.$constructor = function(images, callback){
	this.callback = callback || null;
	this.error = 0;
	this.counter = 0;
	this.images = images || [];
	this.img = new Image();
	this.dom = {};

	this._buildLoader();

	this.loadEvent = JAK.Events.addListener(this.img, 'load', this, '_loaded');
	this.errorEvent = JAK.Events.addListener(this.img, 'error', this, '_errored');

	this.img.src = this.images[this.counter];
};

ImageLoader.prototype._buildLoader = function(){
	this.dom.root = JAK.mel('div', { className : 'ImageLoader' });
	document.body.appendChild(this.dom.root);
};

ImageLoader.prototype._write = function(str){
	this.dom.root.innerHTML += '<p>'+str+'</p>';
};

ImageLoader.prototype._loaded = function(e, elm){
	var str = '<strong>'+(this.counter+1)+'.</strong> <i>'+this.images[this.counter]+'</i> ......................... loaded';
	this._write(str);
	this.counter++;
	if(this.counter >= this.images.length){
		this._done();
		this.makeEvent('images-loadded', { error : this.error });
	} else {
		this.img.src = this.images[this.counter];
	}
};

ImageLoader.prototype._errored = function(e, elm){
	this.error = 1
	var str = '<strong>'+(this.counter+1)+'.</strong> <i>'+this.images[this.counter]+'</i> ......................... ERROR';
	this._write(str);
	this.counter++;
	if(this.counter >= this.images.length){
		this.makeEvent('images-loaded', { error : this.error });
		this._done();
	} else {
		this.img.src = this.images[this.counter];
	}	
};

ImageLoader.prototype._done = function(){
	if(!!this.callback){
		var status = this.error ? false : true;
		this.callback(status);
	}
};

ImageLoader.prototype.hide = function(){
	this.dom.root.parentNode.removeChild(this.dom.root);
};
