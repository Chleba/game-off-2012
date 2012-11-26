var BattleMage = BattleMage || {};

BattleMage.Audio = JAK.ClassMaker.makeClass({
	NAME : 'BattleMage.Audio',
	VERSION : '1.0',
	IMPLEMENT : JAK.ISignals
});

BattleMage.Audio.prototype.$constructor = function(){
	this._supported = !!window.Audio;
	var tmp = new Audio();
	this._ext = (tmp.canPlayType("audio/ogg") ? "ogg" : "mp3");

	this._effects = {
		death:		{ count: 5 },
		deflect:	{ count: 3 },
		blaster:	{ count: 4 },
		saber:		{ count: 8 },
		victory:	{ count: 1 }
	};

	for (var name in this._effects) {
		this.data = this._effects[name];
		this.data.audio = [];
		for (var i=0;i<this.data.count;i++) {
			var n = name;
			if (this.data.count > 1) { n += i; }
			var a = new Audio(this._expandName(n));
			a.volume = 0.6;
			a.load();
			this.data.audio.push(a);
		}
	}
	this._link();
};

BattleMage.Audio.prototype.randRange = function(min, max){
	var rand = (Math.floor(Math.random() * (min-max+1))+min)*-1;
	//var rand = Math.floor(Math.random() * (max - min + 1) + min)
	return rand;
};

BattleMage.Audio.prototype.play = function(name) {
	if (!this._supported) { return; }
	var data = this._effects[name];
	if (!data) { return; }
	var rand = this.randRange(0, data.count);
	data.audio[rand].play();
};

BattleMage.Audio.prototype._expandName = function(name) {
	return "sfx/" + name  + "." + this._ext;
};

BattleMage.Audio.prototype._playSound = function(e){
	var name = e.data.soundName;
	this.play(name);
};

BattleMage.Audio.prototype._link = function(){
	this.soundListener = this.addListener( 'playSound', this._playSound.bind(this) );
};
