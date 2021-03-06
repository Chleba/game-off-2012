/**
 * discreet shadow casting algorithm with many thanks to Ondrej Zara <ondra.zarovi.cz>
 **/

RPGMAP.ShadowLighting = JAK.ClassMaker.makeClass({
	VERSION : '1.1',
	NAME : 'RPGMAP.ShadowLighting',
	EXTEND : RPGMAP
});

RPGMAP.ShadowLighting.prototype._visibleCoords = function(blocks, startArc, arcsPerCell, arcs) {
	var eps = 1e-4;
	var startIndex = Math.floor(startArc);
	var arcCount = arcs.length;
	var ptr = startIndex;
	var given = 0; /* amount already distributed */
	var amount = 0;
	var arc = null;
	var ok = false;
	do {
		var index = ptr; /* ptr recomputed to avail range */
		if (index < 0) { index += arcCount; }
		if (index >= arcCount) { index -= arcCount; }
		arc = arcs[index];
		/* is this arc is already totally obstructed? */
		var chance = (arc[0] + arc[1] + eps < 1);
		if (ptr < startArc) {
			/* blocks left part of blocker (with right cell part) */
			amount += ptr + 1 - startArc;
			if (chance && amount > arc[0]+eps) {
				/* blocker not blocked yet, this cell is visible */
				ok = true;
				/* adjust blocking amount */
				if (blocks) { arc[0] = amount; }
			}
		} else if (given + 1 > arcsPerCell)  { 
			/* blocks right part of blocker (with left cell part) */
			amount = arcsPerCell - given;
			if (chance && amount > arc[1]+eps) {
				/* blocker not blocked yet, this cell is visible */
				ok = true;
				/* adjust blocking amount */
				if (blocks) { arc[1] = amount; }
			}
		} else {
			/* this cell completely blocks a blocker */
			amount = 1;
			if (chance) {
				ok = true;
				if (blocks) {
					arc[0] = 1;
					arc[1] = 1;
				}
			}
		}
		given += amount;
		ptr++;
	} while (given < arcsPerCell);
	return ok;
};
RPGMAP.ShadowLighting.prototype.getCoordsInCircle = function(center, radius, includeInvalid) {
	var arr = [];
	var W = this.MAP.length;
	var H = this.MAP[0].length;
	var c1 = [];
	for(var i=0;i<center.length;i++){
		c1.push(center[i]);
	}
	var c2 = [c1[0]+radius, c1[1]+radius];
	var c = c2;
	var dirs = [0, 6, 4, 2];
	var count = 8*radius;
	for (var i=0;i<count;i++) {
		if (c[0] < 0 || c[1] < 0 || c[0] >= W || c[1] >= H) {
			if (includeInvalid) { arr.push(null); }
		} else {
			arr.push(c);
		}
		var dir = dirs[Math.floor(i*dirs.length/count)];
		c = [c[0]+RPG.DIR[dir][0], c[1]+RPG.DIR[dir][1]];
	}
	return arr;
};

RPGMAP.ShadowLighting.prototype._blocks = function(c){
	var cons = this.MAP[c[0]][c[1]];
	var obj = RPG.STYLE[cons];
	var solid = obj.solid;
	return solid;
};

RPGMAP.ShadowLighting.prototype.showShadow = function(){
	var R = this.radius;
	var center = this.coordsStart;
	var map = this.MAP;
	//debugger;
	var eps = 1e-4;
	var c = false;
	/* directions blocked */
	var arcs = [];
	/* results */
	var result = [];
	result.push(this.coordsStart);
	/* number of cells in current ring */
	var cellCount = 0;
	var arcCount = R*8; /* length of longest ring */
	for (var i=0;i<arcCount;i++) { arcs.push([0, 0]); }
	/* analyze surrounding cells in concentric rings, starting from the center */
	for (var r=1; r<=R; r++) {
		cellCount += 8;
		var arcsPerCell = arcCount / cellCount; /* number of arcs per cell */
		var coords = this.getCoordsInCircle(center, r, true);
		for (var i=0;i<coords.length;i++) {
			if (!coords[i]) { continue; }
			c = coords[i];
			var startArc = (i-0.5) * arcsPerCell + 0.5;
			if (this._visibleCoords(this._blocks(c), startArc, arcsPerCell, arcs)) { 
				result.push(c);
			}/*- else {
				result.push(null);
			}-*/
			/* cutoff? */
			var done = true;
			for (var j=0;j<arcCount;j++) {
				if (arcs[j][0] + arcs[j][1] + eps < 1) {
					done = false;
					break;
				}
			}
			if (done) { return result; }
		} /* for all cells in this ring */
	} /* for all rings */
	return result;
};
