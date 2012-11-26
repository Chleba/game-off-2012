
BattleMage.NPC = JAK.ClassMaker.makeClass({
	NAME : 'BattleMage.NPC',
	VERSION : '1.0',
	IMPLEMENT : JAK.ISignals
});

BattleMage.NPC.prototype.$constructor = function(dung, opt){
	this.uniqueID = JAK.idGenerator();
	this.opt = {
		startPos : { x : 0, y : 0 },
		canvas : null,
		stop : false
	};
	for(var p in opt){ this.opt[p] = opt[p]; }
	this.dung = dung;
	
	this.HP = 100;
	this.DMG = 10;

	this.map = this.dung.getMapInstance();
	this.mapPointSize = this.map.getPointSize();
	this.interval = 500;
	this.startTime = new Date().getTime();

	this.canvas = this.opt.canvas.getContext('2d');

	this.direction = RPG.E;
	this.moving = false;
	this.pxcoords = { x : 0, y : 0 };

	this.dmgsTexts = [];

	this._makeSprite();
	this._makeNPC();
};

BattleMage.NPC.prototype._makeSprite = function(){
	this.jsonSprites = {
		move : JSONStormtrooperMove
	};
	this.spriteStatus = this.jsonSprites.move;
	this.SPRITE = {
		imgPath : './img/starwars/',
		scale : 0.8,
		start : new Date().getTime(),
		mirrored : false,
		jsonMap : this.spriteStatus
	}

	this.SPRITE[RPG.N] = this.jsonSprites.move.spriteBuddy.animations.animation[3];
	this.SPRITE[RPG.W] = this.jsonSprites.move.spriteBuddy.animations.animation[1];
	this.SPRITE[RPG.E] = this.jsonSprites.move.spriteBuddy.animations.animation[2];
	this.SPRITE[RPG.S] = this.jsonSprites.move.spriteBuddy.animations.animation[0];

	this.SPRITE.animation = this.SPRITE[RPG.N];

	this.sprite = new Sprite(this.canvas, this.SPRITE);
};

BattleMage.NPC.prototype.$destructor = function(){
	this.death = true;
};

BattleMage.NPC.prototype._pxPos = function(coords){
	var x = coords[1]*this.mapPointSize.w;
	var y = coords[0]*this.mapPointSize.h;
	return { x : x, y : y };
};

BattleMage.NPC.prototype.update = function(){
	var ds = this.startTime+this.interval;
	var d = new Date().getTime();
	if(!this.moving){
		if(d > ds){
			this._move();
			this.startTime = d;
		}
	} else {
		var delta = new Date().getTime() - this.moveTime;
		var num = (delta / this.interval) % 1;
		this._moveAnim(num);
	}

	this._updateDmg();
};

BattleMage.NPC.prototype._moveAnim = function(num){
	var corner = { x : 0, y : 0 };
	if(!this.dung.opt.allMap){
		corner = this.map._smallCorner();
	}
	var pxEnd = this._pxPos(this.coords);
	//console.log(pxEnd);

	var l = this.left;
	var t = this.top;

	var solLeft = ((pxEnd.x-l)*num)+l;
	var solTop = ((pxEnd.y-t)*num)+t;

	this.smallPxCoords = { x : solLeft, y : solTop };

	this.left = solLeft;
	this.top = solTop;

	this.smallPxCoords = { x : solLeft-corner.x, y : solTop-corner.y };

	//console.log(this.left, this.top);
	if(num > 0.90){
		this.moving = false;
	}
};

BattleMage.NPC.prototype.draw = function(){
	var a = this.map.showShadow();
	for(var i=0;i<a.length;i++){
		if(this.coords[0] == a[i][0] && this.coords[1] == a[i][1]){
			this._draw();
			break;
		}
	}
};

BattleMage.NPC.prototype._draw = function(){
	var simg = this.SPRITE.img;

	if(!!this.dung.opt.allMap){
		var left = this.left;
		var top = this.top;
	} else {
		var left = this.smallPxCoords.x;
		var top = this.smallPxCoords.y;
	}

	// sprites
	var pos = { x : left + (this.mapPointSize.w / 2), y : top + (this.mapPointSize.h / 2) };
	if(this.moving){
		this.sprite.changeAnimation(this.SPRITE[this.direction]);
		this.sprite.draw( pos );
	} else {
		this.sprite.drawSingleFrame( pos, this.SPRITE[this.direction].frames.frame[0] );
	}

	this._drawDmg();
};

BattleMage.NPC.prototype.hasCoords = function(coords){
	if(String(this.coords) == String(coords)){
		return this;
	}
	return 0;
};

BattleMage.NPC.prototype.getCoords = function(){
	return this.coords;
};

BattleMage.NPC.prototype.getSmallPxCoords = function(){
	return this.smallPxCoords;
};

BattleMage.NPC.prototype.getSmallMiddleCoords = function(){
	var width = this.SPRITE[this.direction].frames.frame[0].layers.layer.rect.width;
	var height = this.SPRITE[this.direction].frames.frame[0].layers.layer.rect.height;
	var obj = {
		x : this.smallPxCoords.x + ((width * this.SPRITE.scale) / 2),
		y : this.smallPxCoords.y + ((height * this.SPRITE.scale) / 2)
	};
	return obj;
};

BattleMage.NPC.prototype.getDmg = function(dmg){
	this.HP -= dmg;
	if(this.HP <= 0){
		this._die();
		return true;
	} else {
		this._showDmg(dmg);
	}
	return false;
};

BattleMage.NPC.prototype._die = function(){
	this.makeEvent('playSound', { soundName : 'death' });
	this.$destructor();
};

BattleMage.NPC.prototype._showDmg = function(dmg){
	this.dmgsTexts.push({
		dmg : dmg,
		coords : { x : this.smallPxCoords.x , y : this.smallPxCoords.y },
		iteration : 0
	});
};

BattleMage.NPC.prototype._updateDmg = function(){
	var doneDmgs = [];
	for(var i=0;i<this.dmgsTexts.length;i++){
		var dt = this.dmgsTexts[i];
		if(dt.iteration >= 20){
			doneDmgs.push(i);
		}
		dt.coords.y -= 2;
		dt.iteration += 1;
	}

	// delete dmgs
	for(var i=0;i<doneDmgs.length;i++){
		this.dmgsTexts.splice( doneDmgs[i], 1 );
	}
};

BattleMage.NPC.prototype._drawDmg = function(){
	for(var i=0;i<this.dmgsTexts.length;i++){
		var dt = this.dmgsTexts[i];
		this.canvas.font = 'normal 24px Arial';
		this.canvas.fillStyle = 'red';
		//this.canvas.lineWidth = '6';
		this.canvas.fillText( dt.dmg, dt.coords.x, dt.coords.y );
	}
};

BattleMage.NPC.prototype._makeNPC = function(){
	if(this.opt.startPos.x == 0 || this.opt.startPos.y == 0){
		var rx = this.map._randRange(0, this.map.MAP.length-1);
		var ry = this.map._randRange(0, this.map.MAP[0].length-1);
	} else {
		var rx = this.opt.startPos.x;
		var ry = this.opt.startPos.y;
	}
	this.coords = [rx, ry];

	this.left = this.mapPointSize.w * this.coords[0];
	this.top = this.mapPointSize.h * this.coords[1];

	var corner = this.map._smallCorner();
	this.smallPxCoords = { x : this.left - corner.x, y : this.top - corner.y };
};

BattleMage.NPC.prototype._direction = function(){
	var rand = Math.floor(Math.random() * (4 - 1 + 1) + 1);
	switch(rand){
		case 1 : var dir = RPG.N; break;
		case 2 : var dir = RPG.S; break;
		case 3 : var dir = RPG.E; break;
		case 4 : var dir = RPG.W; break;
		default : var dir = RPG.N; break;
	}
	return dir;
};

BattleMage.NPC.prototype._moveCoords = function(){
	var place = RPG.NONE;
	var pc = this.dung.player.getCoords();
	var i = 0;
	do {
	    if(i == 8){ return { coords : this.coords, dir : this.direction } }
	    i++;
		var dirCons = this._direction();
		var dir = RPG.DIR[dirCons];
		var nc = [this.coords[0]+dir[0], this.coords[1]+dir[1]];
		var x = nc[0];
		var y = nc[1];
		if(x < 0){ x = 0; } else if(x > this.map.MAP[0].length-1){ x = this.map.MAP[0].length-1; }
		if(y < 0){ y = 0; } else if(y > this.map.MAP.length-1){ y = this.map.MAP.length-1; }
		var place = this.map.MAP[x][y];
		// player finding
		if(pc[0] == x && pc[1] == y){
			place = RPG.YOU;
		}
	} while(!!RPG.STYLE[place].solid || place == RPG.YOU);
	return { coords : nc, dir : dirCons };
};

BattleMage.NPC.prototype._isOnRange = function(coords){
	var pc = this.dung.player.getCoords();
	var a = (pc[0]-coords[0])
	var b = (pc[1]-coords[1])
	var c = Math.sqrt((a*a)+(b*b));
	if(c < this.dung.opt.radius){ return c; }
	return 0;
};

BattleMage.NPC.prototype._nearCoords = function(){
	var r = this._isOnRange(this.coords);
	var far = [];
	var fc = {};
	var i = 0;
 	do {
 		var m = this._moveCoords();
        var coords = m.coords;
		var r1 = this._isOnRange(coords);
		if(r1 < 2){ this._attack(); break; }
		if(far.indexOf(r1) == -1){
			far.push(r1);
			fc[r1] = m;
		}
		if(i == 8){
			return fc[far.min()];
		}
		i++;
	} while(r1 >= r)
	return m;
};

BattleMage.NPC.prototype._move = function(){
	this.oldCoords = [this.coords[0], this.coords[1]];
	var isOnRange = this._isOnRange(this.coords);
	if(!!isOnRange){
	    var nc = this._nearCoords();
	    this.nearPlayer = true;
	} else {
		this.nearPlayer = false;
		var nc = this._moveCoords();
	}

	if(!!this.opt.stop){
		this.coords = this.coords;
	} else {
		this.coords = nc.coords;
		this.direction = nc.dir;
	}

	this.moving = true;
	this.moveTime = new Date().getTime();
};

BattleMage.NPC.prototype._attack = function(){
	this.makeEvent('npcAttack', { dmg : this.DMG, npcID : this.uniqueID });
};
