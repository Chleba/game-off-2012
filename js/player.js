BattleMage.Player = JAK.ClassMaker.makeClass({
	NAME : 'BattleMage.Player',
	VERSION : '1.0',
	IMPLEMENT : JAK.ISignals
});

BattleMage.Player.prototype.$constructor = function(dung, canvas){
	this.dung = dung;
	this.map = this.dung.getMapInstance();
	this.mapSize = this.map.getMapSize();
	this.opt = {
		step : this.dung.opt.step
	};

	this.HP = RPG.HP;

	this.ipadDebug = false;
	this.stickImg = new Image();
	this.stickImg.src = './img/stick.png';

	this.moving = false;
	this.direction = this.dung.direction;

	this.dom = {};
	this.ec = [];
	this.sigs = [];

	this.dom.canvas = canvas;
	this.canvas = this.dom.canvas.getContext('2d');

	this.pxCoords = { x : 0, y : 0 };
	this.coords = { x : 0, y : 0 };

	this.canvasPos = JAK.DOM.getBoxPosition(this.map.getDomCanvas());
	this.canvasSize = { width : this.map.getDomCanvas().width, height : this.map.getDomCanvas().height };	

	this.attack = new BattleMage.Attack(this);
	this._makeSprite();
	this._link();
};

BattleMage.Player.prototype._makeSprite = function(){
	this.jsonSprites = {
		move : JSONJediMove
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

BattleMage.Player.prototype._dmg = function(e){
	if(e.type == 'npcShotHit'){
		if(!!this.blocking){
			var rand = Math.random();
			if(rand > 0.53){
				var npc = null;
				var npcs = this.dung.npcs;
				for(var i=0;i<npcs.length;i++){
					if(npcs[i].uniqueID == e.data.npcId){
						var npc = npcs[i];
						break;
					}
				}
				if(!!npc){
					var img = new Image();
					img.src = './img/blastershot.png';
					var shotOpt = {
						img : img,
						canvas : this.canvas,
						from : this.getPosition(),
						to : npc.getSmallMiddleCoords(),
						eventType : 'reverseShot',
						eventData : { npcId : npc.uniqueID }
					};
					this.shot = new BattleMage.SHOT(shotOpt);

					this.makeEvent('playSound', { soundName : 'deflect' });

				}
			}
			return;
		}
	}

	this.HP = this.HP-e.data.dmg < 0 ? 0 : this.HP-e.data.dmg;
	if(this.HP <= 0){
		this._death();
	}
	this.makeHPBar();
};

BattleMage.Player.prototype._death = function(){
	this.deathImg = new Image();
	this.deathImg.src = './img/skull.jpg';
	//this.deathImgSize = { w : this.deathImg.offsetWidth, h : this.deathImg.offsetHeight };
	this.dead = true;
};

BattleMage.Player.prototype._drawDeath = function(){
	var iterations = 20;
	if(this.deathIteration >= 0){
		this.deathIteration += 1;
	} else {
		this.deathIteration = 0;
	}
	if(this.deathIteration >= iterations){
		this.deathIteration = iterations;
	}
	var width = this.mapSize.w / (iterations - this.deathIteration);
	var height = this.mapSize.h / (iterations - this.deathIteration);
	var size = {
		w : width >= this.mapSize.w ? this.mapSize.w : width,
		h : height >= this.mapSize.h ? this.mapSize.h : height
	}
	this.canvas.drawImage( this.deathImg, 0, 0, size.w, size.h);
};

BattleMage.Player.prototype.makeHPBar = function(){
	this.canvas.fillStyle = 'rgba(204, 0, 0, 0.3)';
	this.canvas.fillRect( this.mapSize.w-100, /*this.mapSize.h-*/0, 100, 18 );
	this.canvas.fillStyle = 'rgba(0, 204, 0, 0.3)';/*-#00cc00-*/
	var hp = this.HP/(RPG.HP/100);
	this.canvas.fillRect( this.mapSize.w-100, /*this.mapSize.h-*/0, hp, 18 );
}

BattleMage.Player.prototype.setCenter = function(center){
	this.pxCoords = center;

	if(this.dung.opt.allMap){
		var corner = { x : 0, y : 0 };
	} else {
		var corner = this.map._smallCorner();	
	}
	this.left = (this.pxCoords.x-corner.x);
	// TODO - zjistovat direction podle analogu
	this.top = (this.pxCoords.y-corner.y);
};

BattleMage.Player.prototype.draw = function(){
	// shot
	if(!!this.shot){
		if(!!this.shot.draw){
			this.shot.draw();
		} else {
			this.shot = null;
		}
	}	
	// death
	if(!!this.dead){
		this.dung._gameOver();
		/*-
		this._drawDeath();
		return;
		-*/
	}
	// attack
	if(!!this.attacking){
		this.attack.draw();
	}
	// sprites
	var pos = { x : this.left, y : this.top };
	if(this.moving){
		this.sprite.changeAnimation(this.SPRITE[this.direction]);
		this.sprite.draw( pos );
	} else {
		this.sprite.drawSingleFrame( pos, this.SPRITE[this.direction].frames.frame[0] );
	}
	// hp bar
	this.makeHPBar();
	// analog stick
	if(JAK.Browser._platform == 'iPad' || this.ipadDebug){
		this._stickDraw();
	}
};

BattleMage.Player.prototype._stickDraw = function(){
	this.stickCanvas.clearRect(0, 0, this.stickCanvasSize.w, this.stickCanvasSize.h);
	var stick = this.stick;
	var knobSize = 60;

	this.stickCanvas.save();
	this.stickCanvas.drawImage(
		this.stickImg,
		0, 0,
		88, 88,
		stick.limit.x - (this.stickLimitSize / 2), stick.limit.y - (this.stickLimitSize / 2),
		this.stickLimitSize, this.stickLimitSize
	);

	this.stickCanvas.drawImage(
		this.stickImg,
		89, 14,
		knobSize, knobSize,
		stick.input.x - (knobSize/2), stick.input.y - (knobSize/2),
		knobSize, knobSize
	);
	
	this.stickCanvas.restore();
};

BattleMage.Player.prototype.update = function(){
	if(!!this.shot){
		if(!!this.shot.update){
			this.shot.update();
		} else {
			this.shot = null;
		}
	}

	if(!!this.attacking){
		this.attack.update();
	}

	if(JAK.Browser._platform == 'iPad' || !!this.ipadDebug){
		var pxCoords = this._stickUpdate();
		//throw new Error('pxc ' + pxCoords.x+' - '+pxCoords.y);
	} else {
		var d = new Date().getTime();
		var da = (d - this.startTime) / 1000;
		this.startTime = d;

		var pxCoords = { x : this.pxCoords.x, y : this.pxCoords.y };

		if(this.moveLeft || this.moveRight || this.moveTop || this.moveBottom){
			this.moving = true;

			if(this.moveLeft){
				this.direction = RPG.W;
				pxCoords.x += Math.floor(-this.opt.step * da);
			}
			if (this.moveRight){
				this.direction = RPG.E;
				pxCoords.x += Math.ceil(this.opt.step * da);
			}
			if (this.moveTop){
				this.direction = RPG.N;
				pxCoords.y += Math.floor(-this.opt.step * da);
			}
			if (this.moveBottom){
				this.direction = RPG.S;
				pxCoords.y += Math.ceil(this.opt.step * da);
			}
		}
	}
    
	var coords = this.map.getCoords(pxCoords);
	var canI = this._finder(coords);
	if(canI){
		this.pxCoords.x = pxCoords.x;
		this.pxCoords.y = pxCoords.y;

		if(this.dung.opt.allMap){
			var corner = { x : 0, y : 0 };
		} else {
			var corner = this.map._smallCorner();	
		}
		this.left = (this.pxCoords.x-corner.x);
		// TODO - zjistovat direction podle analogu
		this.top = (this.pxCoords.y-corner.y);

	} else {
		this.moving = false;
	}
};

BattleMage.Player.prototype._stickUpdate = function(){
	this.stick.update();
	var threshold = 4;

	var d = new Date().getTime();
	var da = (d - this.startTime) / 1000;
	this.startTime = d;

	var pxCoords = { x : this.pxCoords.x, y : this.pxCoords.y };

	if (this.stick.active && (this.stick.length > threshold)) {
		this.moving = true;
		var x = (this.stick.length * this.stick.normal.x);
		var y = (this.stick.length * this.stick.normal.y);

		if(x > this.stickInputSize / 2){
			this.moveRight = true;
			this.direction = RPG.E;
			pxCoords.x += Math.floor(this.opt.step * da);
		} else if(x < this.stickInputSize / 2 * -1) {
			this.moveLeft = true;
			this.direction = RPG.W;
			pxCoords.x += Math.floor(-this.opt.step * da);
		}
		if(y > this.stickInputSize / 2){
			this.moveBottom = true;
			this.direction = RPG.S;
			pxCoords.y += Math.floor(this.opt.step * da);
		} else if (y < this.stickInputSize / 2 * -1) {
			this.moveTop = true;
			this.direction = RPG.N;
			pxCoords.y += Math.floor(-this.opt.step * da);
		}
	}
	
	return pxCoords;
};

BattleMage.Player.prototype.getPosition = function(){
	return { x : this.left, y : this.top };
};

BattleMage.Player.prototype.getDirection = function(){
	return this.direction;
};

BattleMage.Player.prototype._finder = function(coords){
	var map = this.map.getMap();
	if((coords[0] >= 0 || coords[0] < map.length) && (coords[1] >= 0 || coords[1] < map[0].length)){
		var cons = map[coords[0]][coords[1]];
		var obj = RPG.STYLE[cons];
		var canI = !RPG.STYLE[cons].solid ? true : false;
		return canI;
	}
};

BattleMage.Player.prototype._moveStart = function(e, elm){
	var k = e.keyCode;
	switch(k){
		/*- block -*/
		case 88 :
			this.blocking = true;
			JAK.Events.cancelDef(e);
			break;
		/*- attack -*/
		case 32 :
			JAK.Events.cancelDef(e);
			if(!!this.blocking){ break; }
			this.attacking = true;
			break;
		case 38 :
			/*- up -*/
			this.moveTop = true;
			JAK.Events.cancelDef(e);
			break;
		case 40 :
			/*- down -*/
			this.moveBottom = true;
			JAK.Events.cancelDef(e);
			break;
		case 39 :
			/*- right -*/
			this.moveRight = true;
			JAK.Events.cancelDef(e);
			break;
		case 37 :
			/*- left -*/
			this.moveLeft = true;
			JAK.Events.cancelDef(e);
			break;
	}
	//if(k == 39 || k == 37 || k == 38 || k == 40){ this._tick(); }
};

BattleMage.Player.prototype._moveEnd = function(e, elm){
	var k = e.keyCode;
	switch(k){
		/*- block -*/
		case 88 :
			this.blocking = false;
			JAK.Events.cancelDef(e);
			break;
		/*- attack -*/
		case 32 :
			this.attacking = false;
			JAK.Events.cancelDef(e);
			break;
		case 39:
			this.moveRight = false;
			this.moving = false;
			break;
		case 37:
			this.moveLeft = false;
			this.moving = false;
			break;
		case 38:
			this.moveTop = false;
			this.moving = false;
		case 40:
			this.moveBottom = false;
			this.moving = false;
			break;
	}
};

BattleMage.Player.prototype.getCoords = function(){
	return this.map.getCoords(this.pxCoords);
};

BattleMage.Player.prototype.getPxCoords = function(){
	return this.pxCoords;
};

BattleMage.Player.prototype._stickInit = function(){
	this.stickBuffer = 65;
	this.stickLimitSize = 88;
	this.stickInputSize = 10;
	this.stickCanvasSize = { w : 1024, h : 690 };
	this.stick = new Stick(this.stickInputSize);

	this.stick.setLimitXY( this.stickCanvasSize.w - this.stickLimitSize*2, this.stickCanvasSize.h - this.stickBuffer*2);
	this.stick.setInputXY( this.stickCanvasSize.w - this.stickLimitSize*2, this.stickCanvasSize.h - this.stickBuffer*2);

	this.dom.stickCanvas = JAK.mel('canvas', { className : 'stickCanvas' }, {
		position : 'absolute',
		bottom : '0px',
		left : '0px',
		border : '1px solid red',
		zIndex : '99'
	});
	this.dom.stickCanvas.width = this.stickCanvasSize.w;
	this.dom.stickCanvas.height = this.stickCanvasSize.h;
	this.stickCanvas = this.dom.stickCanvas.getContext('2d');
	document.body.appendChild(this.dom.stickCanvas);

	if(!!this.ipadDebug){
		this.ec.push( JAK.Events.addListener( this.dom.stickCanvas, 'mousedown', this, '_touchStart' ) );
		this.ec.push( JAK.Events.addListener( document.body, 'mousemove', this, '_touchMove' ) );
		this.ec.push( JAK.Events.addListener( document.body, 'mouseup', this, '_touchEnd' ) );	
	} else {
		this.ec.push( JAK.Events.addListener( this.dom.stickCanvas, 'touchstart', this, '_touchStart' ) );
		this.ec.push( JAK.Events.addListener( this.dom.stickCanvas, 'touchmove', this, '_touchMove' ) );
		this.ec.push( JAK.Events.addListener( this.dom.stickCanvas, 'touchend', this, '_touchEnd' ) );	
	}
};

BattleMage.Player.prototype._touchStart = function(e, elm){
	JAK.Events.cancelDef(e);
	var stick = this.stick;0
	var touch = !!this.ipadDebug ? e : e.touches[0];
	if(!!this.ipadDebug){
		stick.setInputXY(touch.layerX, touch.layerY);
	} else {
		stick.setInputXY(touch.pageX, touch.pageY);	
	}
	stick.active = true;
};

BattleMage.Player.prototype._touchMove = function(e, elm){
	JAK.Events.cancelDef(e);
	if(!!this.stick.active){
		var stick = this.stick;
		var touch = !!this.ipadDebug ? e : e.touches[0];
		if(!!this.ipadDebug){
			stick.setInputXY(touch.layerX, touch.layerY);
		} else {
			stick.setInputXY(touch.pageX, touch.pageY);	
		}
	}
};

BattleMage.Player.prototype._touchEnd = function(e, elm){
	JAK.Events.cancelDef(e);
	this.stick.setInputXY(this.stick.limit.x, this.stick.limit.y);
	var touches = e.changedTouches;
	this.stick.active = false;
};

BattleMage.Player.prototype._makeAttackButton = function(){
	this.dom.attackButton = JAK.mel('div', { className : 'attackButton' }, {
		position : 'absolute',
		width : '100px',
		height : '100px',
		background : 'red',
		bottom : '20px',
		left : '20px',
		zIndex : '999'
	});
	document.body.appendChild( this.dom.attackButton );
	this.ec.push( JAK.Events.addListener(this.dom.attackButton, 'touchstart', this._touchAttack.bind(this, true) ) );
	this.ec.push( JAK.Events.addListener(this.dom.attackButton, 'touchend', this._touchAttack.bind(this, false) ) );
};

BattleMage.Player.prototype._touchAttack = function(status, e, elm){
	JAK.Events.cancelDef(e);
	this.attacking = status || false;
};

BattleMage.Player.prototype._link = function(){
	if(JAK.Browser._platform == 'iPad' || !!this.ipadDebug){
		this._stickInit();
		this._makeAttackButton();
	} else {
		this.ec.push( JAK.Events.addListener(window, 'keydown', this, '_moveStart') );
		this.ec.push( JAK.Events.addListener(window, 'keyup', this, '_moveEnd') );	
	}
	this.sigs.push( this.addListener( 'npcShotHit', this._dmg.bind(this) ) );
	this.sigs.push( this.addListener( 'npcAttack', this._dmg.bind(this) ) );
};
