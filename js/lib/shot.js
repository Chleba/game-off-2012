BattleMage.SHOT = JAK.ClassMaker.makeClass({
	NAME : 'BattleMage.SHOT',
	VERSION : '1.0',
	IMPLEMENT : JAK.ISignals
});
BattleMage.SHOT.prototype.$constructor = function(opt){
	this.alive = 1;
	this.particles = [];
	this.opt = {
		canvas : null,
		from : { x : 0, y : 0 },
		to : { x : 0, y : 0 },
		life : 500,
		eventType : 'shotHit',
		eventData : {}
	}
	for(var p in opt){
		this.opt[p] = opt[p];
	}
	if(!this.opt.img){
		this.opt.img.src = './img/strela.png';
	}
	this.img = this.opt.img;
	this.canvas = this.opt.canvas;

	this.startTime = new Date();
	
	this.posX = this.opt.from.x;
	this.posY = this.opt.from.y;
	
	this.angle = Math.atan2( (this.opt.to.y - this.posY), (this.opt.to.x - this.posX) );
	
	//var speed = 5;
	var dist = Math.sqrt(((this.posX-this.opt.to.x)*(this.posX-this.opt.to.x))+((this.posY-this.opt.to.y)*(this.posY-this.opt.to.y)));
	var speed = dist/10;
	
	var a = this.posX + speed * Math.cos(this.angle);
    var b = this.posY + speed * Math.sin(this.angle);
    
    this.x = a - this.posX;
	this.y = b - this.posY;
};

BattleMage.SHOT.prototype.$destructor = function(){
	/*- destroy myself -*/
	for(var p in this){
		this[p] = null;
	}
};

BattleMage.SHOT.prototype.update = function(){
	var status = true;
	this.posX += this.x;
	this.posY += this.y;

	if(((this.opt.from.x < this.opt.to.x) && (this.posX > this.opt.to.x)) || ((this.opt.from.y < this.opt.to.y) && (this.posY > this.opt.to.y)) ){
		status = false;
	} else if(((this.opt.from.x > this.opt.to.x) && (this.posX < this.opt.to.x)) || ((this.opt.from.y > this.opt.to.y) && (this.posY < this.opt.to.y)) ){
		status = false;
	}
	if(!status){
		this.makeEvent( this.opt.eventType, this.opt.eventData);
		this.$destructor();
	}
};

BattleMage.SHOT.prototype.draw = function(){
	this.canvas.save();
	this.canvas.translate(this.posX, this.posY);
	this.canvas.rotate(this.angle + (Math.PI*90/180) );
	this.canvas.translate( -(5/2), -(16) );
	this.canvas.drawImage(this.img, 0, 0);
	this.canvas.restore();
};

