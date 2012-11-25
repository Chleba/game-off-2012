
RPGMAP = JAK.ClassMaker.makeClass({
	NAME : 'RPGMAP',
	VERSION : '1.0',
	IMPLEMENT : JAK.ISignals
});

RPGMAP.prototype.$constructor = function(opt, map){
	this.ec = [];
	this.opt = {
		pointSize : { w : 50, h : 50 },
		mapElm : null,
		canvas : null,
		radius : 10,
		visibility : false,
		allMap : 1
	}
	for(i in opt){
		this.opt[i] = opt[i];
	}

	this.visibleCoords = [];

	this.oldCoordsStart = [];
	this.coordsStart = [];

	this.objectMap = this._buildConstantObjects(map);

	this.MAP = map || [];
	this.dom = {};
	this.dom.map = JAK.gel(this.opt.mapElm);
	this.radius = this.opt.radius;
};

RPGMAP.prototype.getMapSize = function(){
	var mapSize;
	if(!!this.mapSize){
		mapSize = this.mapSize;
	} else {
		this.mapSize = {
			w : this.opt.pointSize.w * (this.opt.radius * 2) + this.opt.pointSize.w,
			h : this.opt.pointSize.h * (this.opt.radius * 2) + this.opt.pointSize.h
		};
		mapSize = this.mapSize;
	}
	return mapSize;
};

RPGMAP.prototype._buildConstantObjects = function(map){
	var objectMap = [];
	for(var i=0;i<map.length;i++){
		var row = map[i];
		var objectRow = [];
		for(var j=0;j<row.length;j++){
			var item = row[j];
			var obj = {
				cons : item,
				visited : false
			}
			objectRow.push(obj);
		}
		objectMap.push(objectRow);
	}
	return (objectMap);
};

RPGMAP.prototype.build = function(){
	if(!!this.opt.canvas){
		this.canvasBuild = 1;
		this.buildCanvas();
	} else {
		this.htmlBuild = 1;
		this.buildHtml();
	}
};

RPGMAP.prototype.buildHtml = function(){
	this.dom.map.style.position = "relative";
	this.mapWidth = this.opt.pointSize.w * this.MAP[0].length;
	this.mapHeight = this.opt.pointSize.h * this.MAP.length;
	this.dom.map.style.width = this.mapWidth+"px";
	this.dom.map.style.height = this.mapHeight+"px";
	
	if(!this.opt.allMap){

		this.dom.map.style.width = (((this.radius*2)+1)*this.opt.pointSize.w) + 'px';
		this.dom.map.style.height = (((this.radius*2)+1)*this.opt.pointSize.h) + 'px';
		this.dom.map.style.overflow = 'hidden';

		this._smallBuild();
	} else {
	
		var m = this.MAP;
		for(var i=0;i<m.length;i++){
			for(var j=0;j<m[i].length;j++){
				var top = (i*this.opt.pointSize.h)+"px";
				var left = (j*this.opt.pointSize.w)+"px";
				var div = JAK.mel("div", {}, {
					position : "absolute",
					width : this.opt.pointSize.w+"px",
					height : this.opt.pointSize.h+"px",
					backgroundColor : RPG.STYLE[m[i][j]].color,
					border : "1px solid #FFF",
					top : top,
					left : left
				});
				this.dom.map.appendChild(div);
			}
		}
		
	}
	
};

RPGMAP.prototype._smallBuild = function(){
	this._fullscreen();
	var a = this.showShadow();
	var visCoords = this._makeObjectFromVisibleCoords(a)
	this._smallRebuild(visCoords);
};

RPGMAP.prototype._bigBuild = function(){
	var a = this.showShadow();
	var visCoords = this._makeObjectFromVisibleCoords(a)
	this._bigRebuild(visCoords);
};

RPGMAP.prototype.buildCanvas = function(){
	this.dom.canvas = JAK.mel('canvas');
	if(this.opt.allMap){
		var cSize = { w : this.MAP[0].length*this.opt.pointSize.w, h : this.MAP.length*this.opt.pointSize.h };
		this.mapWidth = cSize.w;
		this.mapHeight = cSize.h;
		this.canvasSize = cSize;
		this.dom.canvas.width = this.canvasSize.w;
		this.dom.canvas.height = this.canvasSize.h;
	} else {
		var cSize = { w : (((this.radius*2)+1)*this.opt.pointSize.w), h : (((this.radius*2)+1)*this.opt.pointSize.h) };
		this.dom.canvas.width = cSize.w;
		this.dom.canvas.height = cSize.h;
		this.mapWidth = cSize.w;
		this.mapHeight = cSize.h;
	}
	this.dom.map.appendChild(this.dom.canvas);
	//WebGL2D.enable(this.dom.canvas);
	//this.canvasMap = this.dom.canvas.getContext('webgl-2d');
	this.canvasMap = this.dom.canvas.getContext('2d');

	if(this.opt.allMap){
		this._bigBuild();
	} else {
		this._smallBuild();		
	}

	this.makeEvent('map-loaded');
}

RPGMAP.prototype.getDomCanvas = function(){
	return this.dom.canvas;
};

RPGMAP.prototype.getCanvas = function(){
	return this.canvasMap;
};

RPGMAP.prototype._fullscreen = function(){
	this.pointW = this.opt.pointSize.w;
	this.pointH = this.opt.pointSize.h;
	/*-
	this.pointW = parseInt(this.mapWidth/((this.opt.radius*2)+1));
	this.pointH = parseInt(this.mapHeight/((this.opt.radius*2)+1));
	-*/
	this.smallStart = this._smallCorner();
};

RPGMAP.prototype.getStart = function(){
	return this.start;
};

RPGMAP.prototype.getCoords = function(pxCoords){
	if(!!pxCoords){
		return [ Math.floor(pxCoords.y/this.opt.pointSize.h), Math.floor(pxCoords.x/this.opt.pointSize.w) ];
	} else {
		return this.coordsStart;	
	}
};

RPGMAP.prototype.getMap = function(){
	return this.MAP;
};

RPGMAP.prototype.getPointSize = function(){
	return this.opt.pointSize;
};

RPGMAP.prototype._randRange = function(min, max){
	var rand = (Math.floor(Math.random() * (min-max+1))+min)*-1;
	//var rand = Math.floor(Math.random() * (max - min + 1) + min)
	return rand;
};

RPGMAP.prototype._obsticlesFinder = function(coords){
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

RPGMAP.prototype._clearMap = function(){
	if(this.canvasBuild){
		this.canvasMap.clearRect(0, 0, this.mapWidth, this.mapHeight);
	}
	if(this.htmlBuild){
		JAK.DOM.clear(this.dom.map);
	}
};

RPGMAP.prototype._smallCorner = function(){
	var a = ((this.opt.radius * this.pointW)*2)+this.pointW;
	var middle = ((a-this.pointW)/2);
	var x = this.start[0];
	var y = this.start[1];
	var xx = x-middle < 0 ? 0 : x-middle;
	var yy = y-middle < 0 ? 0 : y-middle;
	return { x : xx, y : yy }
};

RPGMAP.prototype._smallRebuild = function(vis){
	var a = ((this.opt.radius * this.pointW) *2)+this.pointW;
	var middle = ((a-this.pointW)/2);
	var startCoors = this._smallCorner();
	var sx = startCoors.x;
	var sy = startCoors.y;
	this.smallStart = startCoors;
	var ex = (sx+a)+this.pointW > this.MAP.length*this.pointW ? this.MAP.length*this.pointW : (sx+a)+this.pointW;
	var ey = (sy+a)+this.pointH > this.MAP[0].length*this.pointH ? this.MAP[0].length*this.pointH : (sy+a)+this.pointH;
	
	var diffx = sx % (this.pointW * 1);
	var diffy = sy % (this.pointH * 1);

	var ex1 = Math.floor(ex/this.pointW) > this.MAP.length ? this.MAP.length : Math.floor(ex/this.pointW);
	var ey1 = Math.floor(ey/this.pointH) > this.MAP[0].length ? this.MAP[0].length : Math.floor(ey/this.pointH);
	var sx1 = Math.floor(sx/this.pointW) > this.MAP.length ? this.MAP.length : Math.floor(sx/this.pointW);
	var sy1 = Math.floor(sy/this.pointH) > this.MAP[0].length ? this.MAP[0].length : Math.floor(sy/this.pointH);

	var ay = 0;
	for(var i=sy1;i<ey1;i++){
		var ax = 0;
		for(var j=sx1;j<ex1;j++){
			var coords = [i,j].toString();
			var isVisible = vis[coords] ? 1 : 0;
			var color = '#000';

			var left = (this.pointW*ax) - diffx;
			var top = (this.pointH*ay) - diffy;

			if(this.htmlBuild && isVisible){
				var div = JAK.mel("div", {}, {
					position : "absolute",
					width : this.pointW+"px",
					height : this.pointH+"px",
					backgroundColor : RPG.STYLE[this.MAP[i][j]].color,
					top : top+"px",
					left : left+"px"
				});
				this.dom.map.appendChild(div);
			} else {
				if(isVisible){
					color = RPG.STYLE[this.MAP[i][j]].color;
					this.canvasMap.fillStyle = color;
					this.canvasMap.fillRect(left, top, this.pointW, this.pointH);
				}
			}
			ax = ax+1;
		}
		ay = ay+1;
	}
	//this.makeEvent('rebuildMap');
};

RPGMAP.prototype.fillSingleSquare = function(coords, color){
	this.canvasMap.fillStyle = color;
	this.canvasMap.fillRect(this.pointW*coords[0], this.pointH*coords[1], this.pointW, this.pointH);
};

RPGMAP.prototype._makeObjectFromVisibleCoords = function(vis){
	var obj = {};
	for(var i=0;i<vis.length;i++){
		var coords = vis[i].toString();
		obj[coords] = 1;
	}
	return obj;
};

RPGMAP.prototype.draw = function(){
	this._rebuildMap();
};

RPGMAP.prototype._rebuildMap = function(){
	this._clearMap();
	var a = this.showShadow();
	var visCoords = this._makeObjectFromVisibleCoords(a);

	/*- visibility array control -*/
	if(!!this.opt.visibility){
		this._visibleControl(a);
	}

	if(!this.opt.allMap){
		this._smallRebuild(visCoords);
	} else {
		this._bigRebuild(visCoords);
	}
	this.makeEvent('rebuildMap');
};

RPGMAP.prototype._visibleControl = function(coords){
	for(var i=0;i<coords.length;i++){
		var c = coords[i];
		var obj = this.objectMap[c[0]][c[1]];
		if(!!obj.visited){
			continue;
		} else {
			obj.visited = true;
		}
	}
};

RPGMAP.prototype._coordsInVisible = function(coords){
	var obj = this.objectMap[coords[0]][coords[1]];
	return obj.visited;
};

RPGMAP.prototype._bigRebuild = function(vis){
	for(var i=0;i<a.length;i++){
		if(a[i]){
			var x = a[i][0];
			var y = a[i][1];
			
			var color = '#000';
			switch(this.MAP[x][y]){
				case RPG.WALL : color = '#a30000'; break;
				case RPG.NONE : color = '#272727'; break;
				case RPG.YOU : color = '#fff'; break;
				case RPG.NPC : color = '#00FF00'; break;
				case RPG.END : color = '#0000cc'; break;
				default : return; break;
			}
			this.canvasMap.fillStyle = color;
			this.canvasMap.fillRect(this.pointW*x, this.pointH*y, this.pointW, this.pointH);
		}
	}
};

RPGMAP.prototype.showShadow = function(){
	return 0;
};

RPGMAP.prototype.update = function(){
	if(this.opt.allMap){
		if((this.oldCoordsStart[0] != this.coordsStart[0] || this.oldCoordsStart[1] != this.coordsStart[1]) || this.oldCoordsStart.length < 1){
			this.draw();
			this.oldCoordsStart = [];
			this.oldCoordsStart.push(this.coordsStart[0]);
			this.oldCoordsStart.push(this.coordsStart[1]);
		}	
	} else {
		this.draw();
	}
};

RPGMAP.prototype.setMidPoint = function(coords){
	this.start = [coords.x, coords.y];
	this.coordsStart = [ Math.floor(coords.y/this.opt.pointSize.h), Math.floor(coords.x/this.opt.pointSize.w) ];
	this._fullscreen();
	this.smallStart = this._smallCorner();
};
