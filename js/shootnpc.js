
BattleMage.shootNPC = JAK.ClassMaker.makeClass({
	NAME : 'BattleMage.shootNPC',
	VERSION : '1.0',
	IMPLEMENT : JAK.ISignals,
	EXTEND : BattleMage.NPC
});

BattleMage.shootNPC.prototype.$constructor = function(){
	this.$super.apply(this, arguments);
	this._reverseShotListener = this.addListener( 'reverseShot', this._reverseShot.bind(this) );
};

BattleMage.shootNPC.prototype.$destructor = function(){
	this.$super();
	try{
		this.removeListener( this._shotListener );
		this.removeListener( this._reverseShotListener );
	} catch(e){}
};

BattleMage.shootNPC.prototype._reverseShot = function(e){
	if('npcId' in e.data){
		if(e.data.npcId == this.uniqueID){
			this.getDmg(this.DMG);
		}
	}
};

BattleMage.shootNPC.prototype._isNpcVisible = function(){
	var status = false;
	var a = this.map.showShadow();
	for(var i=0;i<a.length;i++){
		if(this.coords[0] == a[i][0] && this.coords[1] == a[i][1]){
			status = true;
			break;
		}
	}
	return status;
};

BattleMage.shootNPC.prototype._move = function(){
	this.oldCoords = [this.coords[0], this.coords[1]];
	var isOnRange = this._isOnRange(this.coords);
	if(!!isOnRange){
	    var nc = this._nearCoords();
	    this.nearPlayer = true;
	    var isNpcVisible = this._isNpcVisible()
	    if(!!isNpcVisible){
	    	this.opt.stop = true;
	    	this._shoot();
	    }
	} else {
		this.nearPlayer = false;
		var nc = this._moveCoords();
		this.opt.stop = false;
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

BattleMage.shootNPC.prototype._shoot = function(){
	if(!this.shot){
		var img = new Image();
		img.src = './img/blastershot.png';
		var from = this.getSmallMiddleCoords();
		var to = this.dung.player.getPosition();
		var shotOpt = {
			canvas : this.canvas,
			from : from,
			to : to,
			img : img
		};
		this.shot = new BattleMage.SHOT(shotOpt);

		this.makeEvent('playSound', { soundName : 'blaster' });

		if(!!this._shotListener){
			try{
				this.removeListener(this._shotListener);
			} catch(e){}
			this._shotListener = null;
		}
		this._shotListener = this.addListener( 'shotHit', this._shotAttack.bind(this), this.shot );
	}
};

BattleMage.shootNPC.prototype.update = function(){
	this.$super();
	if(!!this.shot){
		if(!!this.shot.update){
			this.shot.update();
		} else {
			this.shot = null;
		}
	}
};

BattleMage.shootNPC.prototype.draw = function(){
	this.$super();
	if(!!this.shot){
		if(!!this.shot.draw){
			this.shot.draw();
		} else {
			this.shot = null;
		}
	}
};

BattleMage.shootNPC.prototype._attack = function(){
	return;
};

BattleMage.shootNPC.prototype._shotAttack = function(e){
	this.makeEvent( 'npcShotHit', { dmg : this.DMG, npcId : this.uniqueID } );	
};
