BattleMage.Attack = JAK.ClassMaker.makeClass({
	NAME : 'BattleMage.Attack',
	VERSION : '1.0'
});

BattleMage.Attack.prototype.$constructor = function(player){
	this.player = player;
	this.dung = this.player.dung;
	this.SPRITE = this.player.SPRITE;
	this.DMG = 10;

	this.direction = this.dung.direction;

	this.dom = {};
	this.ec = [];

	this.dom.canvas = this.player.dom.canvas;
	this.canvas = this.dom.canvas.getContext('2d');

	this.startTime = new Date().getTime();
	this._makeAttackImg();
};

BattleMage.Attack.prototype._makeAttackImg = function(){
	this.img = new Image();
	//this.img.src = './img/Sword.png';
	this.img.src = './img/Lightsaber.png';
	//this.imgSize = { w : 17, h : 32 };
	this.imgSize = { w : 10, h : 32 };
	this.diffImageRotate = (Math.PI*-90/180);
};

BattleMage.Attack.prototype._getAttackAngle = function(){
	var angle = {
		start : 0,
		end : 0
	};
	var s = e = 0;
	switch(this.direction){
		case RPG.N : 
			s = 0; e = 180;
			break;
		case RPG.E : 
			s = 90; e = 270;
			break;
		case RPG.S :
			s = 180; e = 360;
			break;
		case RPG.W :
			s = 270; e = 450;
			break;
		default : return; break;
	};
	angle.start = Math.PI*s/180;
	angle.end = Math.PI*e/180;
	return angle;
};

BattleMage.Attack.prototype.draw = function(){	
	var scale = 1.5;
	var sw = this.imgSize.w*scale; sh = this.imgSize.h*scale;
	this.canvas.save();
	var left = this.left;
	var top = this.top;
	//var left = (this.left+(this.SPRITE.step*this.SPRITE.scale) / 2);
	//var top = (this.top+(this.SPRITE[this.direction].height*this.SPRITE.scale) / 2);
	this.canvas.translate(left, top);
	var rad = this.diffImageRotate + this.attackObj.current;
	this.canvas.rotate(rad);
	this.canvas.translate((sw/2)*-1, (sh)*-1);
	this.canvas.drawImage(this.img, 0, 0, sw, sh);
	this.canvas.restore();
	return;

	// OBSOLETE ... line, semi circle
	this.canvas.beginPath();
	this.canvas.lineWidth = 5;
	this.canvas.strokeStyle = '#00cccc';
	///*-
	var left = (this.left+(this.SPRITE.step*this.SPRITE.scale) / 2);
	var top = (this.top+(this.SPRITE[this.direction].height*this.SPRITE.scale) / 2);

	var endPos = {
		x : left - (this.dung.opt.pointSize.w * 1.5) * Math.cos(this.attackObj.current),
		y : top - (this.dung.opt.pointSize.h * 1.5) * Math.sin(this.attackObj.current)
	};

	this.canvas.moveTo(left, top);
	this.canvas.lineTo( endPos.x, endPos.y );
	//-*/
	/*-
	var attackPos = { x : this.left+((this.SPRITE.step*this.SPRITE.scale)/2), y : this.top+((this.SPRITE[this.direction].height*this.SPRITE.scale)/2) };
	var angle = this._getAttackAngle();
	this.canvas.arc( attackPos.x, attackPos.y, 30, angle.start, angle.end, true );
	-*/
	this.canvas.closePath();
	this.canvas.stroke();
	this.canvas.restore();
};

BattleMage.Attack.prototype._dmgNpcs = function(aObj){
	var npcs = this.dung.npcs;
	var nor = [];
	for(var i=0;i<npcs.length;i++){
		if(!!npcs[i].nearPlayer){
			nor.push(npcs[i]);
		}
	}
	
	for(var i=0;i<nor.length;i++){
		var nc = nor[i].getSmallPxCoords();
		///*
		// semi circle
		var radius = this.dung.opt.pointSize.w * 1.5;
		var dx = (nc.x + this.dung.opt.pointSize.w*0.5) - this.left;
		var dy = (nc.y + this.dung.opt.pointSize.h*0.5 ) - this.top;
		var dist = Math.sqrt( dx*dx + dy*dy );

		var nAngle = Math.atan2(dy, dx);
		var na1 = nAngle * 180/Math.PI;
		//console.log(na1+' - angle');
		var hitAngle = this._isRightAngle(na1);
		if(dist <= radius && !!hitAngle ){
			nor[i].getDmg(this.DMG);
		}
		//*/

		/*
		// circle
		var n1 = Math.pow((nc.x-this.left), 2) + Math.pow((nc.y-this.top), 2)
		var r1 = Math.pow( this.dung.opt.pointSize.w * 1.5, 2 );
		
		if(n1 <= r1){
			npcs[i].getDmg(this.DMG);
		}
		-*/
	}
};

BattleMage.Attack.prototype._isRightAngle = function(angle){
	var s, e, hit = false;

	switch(this.direction){
		case RPG.N : 
			s = -180; e = 0;
			break;
		case RPG.E : 
			s = -90; e = 90;
			break;
		case RPG.S :
			s = 0; e = 180;
			break;
		case RPG.W :
			s = 90; e = -90;
			if(((angle > 90 && angle < 180)) || ((angle < -90 && angle > -180))){
				hit = true;
			}
			break;
		default : return; break;
	}

	if(angle > s && angle < e){
		hit = true;
	}

	return hit;
};

BattleMage.Attack.prototype.update = function(){
	var posObj = this.player.getPosition();
	this.left = posObj.x;
	this.top = posObj.y;

	this.direction = this.player.getDirection();

	if(this._attackDir >= 0 && this._attackDir == this.direction){
		if(this.attackObj.current >= this.attackObj.end){
			// DMG NPCS
			this._dmgNpcs( this.attackObj );
			this.attackObj.current = this.attackObj.start;
		} else {
			var d = new Date().getTime();
			var da = (d - this.startTime) / 40;
			this.startTime = d;
			var step = this.attackObj.step * da;
			this.attackObj.current = (step+this.attackObj.current);
		}
		return;
	}
	this._attackDir = this.direction;
	var angle = this._getAttackAngle();
	var step = (angle.end - angle.start) / 10;
	this.attackObj = {
		start : angle.start,
		end : angle.end,
		step : step,
		current : angle.start
	};
};
