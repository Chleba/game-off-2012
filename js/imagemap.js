
RPGMAP.ImageMap = JAK.ClassMaker.makeClass({
	NAME : 'RPGMAP.ImageMap',
	VERSION : '1.1',
	EXTEND : RPGMAP,
	EXTEND : RPGMAP.ShadowLighting
});

RPGMAP.ImageMap.prototype._obsticlesFinder = function(coords){
	if(!coords){ return '#000'; }
	var x = coords[0];
	var y = coords[1];
	var color = '#000';
	switch(this.MAP[x][y]){
		case RPG.WALL : color = '#a30000'; break;
		case RPG.NONE : color = '#272727'; break;
		case RPG.YOU : color = '#fff'; break;
		case RPG.END : color = '#0000cc'; break;
		default : color = '#272727'; break;
	}
	return color;
};

RPGMAP.ImageMap.prototype.build = function(){
	this._imageLoad();
};

RPGMAP.ImageMap.prototype._imageLoad = function(){
	for( i in RPG.STYLE ){
		if(!RPG.STYLE[i].loaded){
			var img = JAK.mel('img');
			img.src = RPG.STYLE[i].img;
			RPG.STYLE[i].loaded = 1;
			RPG.STYLE[i].img = img;
			this.ec.push( JAK.Events.addListener(img, 'load', this, '_imageLoad') );
			return;
		}
	}
	if(!!this.opt.canvas){
		this.canvasBuild = 1;
		this.buildCanvas();
	} else {
		this.htmlBuild = 1;
		this.buildHtml();
	}
};

RPGMAP.ImageMap.prototype._bigRebuild = function(vis){
	for(var i=0;i<this.MAP.length;i++){
		for(var j=0;j<this.MAP[i].length;j++){

			var cons = this.MAP[i][j];
			var di = RPG.STYLE[cons].img;

			var left = j * this.opt.pointSize.w;
			var top = i * this.opt.pointSize.h;

			var coords = [i,j].toString();
			var isVisible = vis[coords] ? 1 : 0;

			if(isVisible){
				this.canvasMap.drawImage(di, left, top, this.opt.pointSize.w, this.opt.pointSize.h);
			} else {
				this._drawNothing({
					x : left,
					y : top
				},[i,j], di);
			}
		}
	}
};

RPGMAP.ImageMap.prototype._smallRebuild = function(vis){
	var a = ((this.opt.radius * this.pointW) *2)+this.pointW;
	var middle = ((a-this.pointW)/2);
	var startCoors = this._smallCorner();
	var sx = startCoors.x;
	var sy = startCoors.y;
	this.smallStart = startCoors;
	var ex = (sx+a)+this.pointW > this.MAP[0].length*this.pointW ? this.MAP[0].length*this.pointW : (sx+a)+this.pointW;
	var ey = (sy+a)+this.pointH > this.MAP.length*this.pointH ? this.MAP.length*this.pointH : (sy+a)+this.pointH;
	
	var diffx = sx % (this.pointW * 1);
	var diffy = sy % (this.pointH * 1);

	var ex1 = Math.floor(ex/this.opt.pointSize.w) > this.MAP[0].length ? this.MAP[0].length : Math.floor(ex/this.opt.pointSize.w);
	var ey1 = Math.floor(ey/this.opt.pointSize.h) > this.MAP.length ? this.MAP.length : Math.floor(ey/this.opt.pointSize.h);
	var sx1 = Math.floor(sx/this.opt.pointSize.w) > this.MAP[0].length ? this.MAP[0].length : Math.floor(sx/this.opt.pointSize.w);
	var sy1 = Math.floor(sy/this.opt.pointSize.h) > this.MAP.length ? this.MAP.length : Math.floor(sy/this.opt.pointSize.h);
	
	//console.log(sx, ex);

	var ay = 0;
	for(var i=sy1;i<ey1;i++){
		var ax = 0;
		for(var j=sx1;j<ex1;j++){
			var coords = [i,j].toString();
			var isVisible = vis[coords] ? 1 : 0;
			var cons = this.MAP[i][j];
			var color = '#000';
			var img = 0;
			if(isVisible){
				img = 1;
				/*-
				switch(cons){
					case RPG.WALL :
						if(RPG.STYLE[RPG.WALL]){ img = 1; }
						color = RPG.STYLE[RPG.WALL].color;
						break;
					case RPG.NONE :
						if(RPG.STYLE[RPG.NONE]){ img = 1; }
						color = RPG.STYLE[RPG.NONE].color;
						break;
					case RPG.END :
						color = '#0000cc'; 
						break;
				}
				-*/
			}

			var left = (this.pointW*ax) - diffx;
			var top = (this.pointH*ay) - diffy;

			if(img){
				var di = RPG.STYLE[cons].img;
				this.canvasMap.drawImage(di, left, top, this.opt.pointSize.w, this.opt.pointSize.h);
			} else { // kresleni toho co nevidim
				var di = RPG.STYLE[cons].img;
				this._drawNothing({
					x : left,
					y : top
				},[i,j], di);
			}
			ax = ax+1;
		}
		ay = ay+1;
	}
	//this.makeEvent('rebuildMap');
};

RPGMAP.ImageMap.prototype._drawNothing = function(pxCoords, coords, img){
	var draw = true;

	if(this.opt.visibility){	
		if(!this._coordsInVisible(coords)){
			draw = false;
		}

	}
	if(draw){
		var simg = img || RPG.STYLE[RPG.NONE].img;
		this.canvasMap.save();
		this.canvasMap.globalAlpha = 0.6;
		this.canvasMap.drawImage(simg, pxCoords.x, pxCoords.y, this.opt.pointSize.w, this.opt.pointSize.h);
		this.canvasMap.restore();	
	}
};

