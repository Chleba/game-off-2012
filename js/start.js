
var BattleMage = BattleMage || {};

BattleMage.StartScreen = JAK.ClassMaker.makeClass({
	NAME : 'BattleMage.StartScreen',
	VERSION : '0.1',
	IMPLEMENT : JAK.ISignals
});

BattleMage.StartScreen.prototype.$constructor = function(){
	this.ec = [];
	this.dom = {};
	this.sigs = [];
	this._build();
};

BattleMage.StartScreen.prototype.$destructor = function(){
	JAK.Events.removeListeners(this.ec);
};

BattleMage.StartScreen.prototype._build = function(){
	this.dom.startRoot = JAK.mel('div', { width : '35%', className : 'startScreen' });
	this.dom.title = JAK.mel('h1', { innerHTML : '<img src="./img/starwarslogo.png" />' });
	
	this.dom.controlDiv = JAK.mel('div', { className : 'controls' });
	this.dom.moveText = JAK.mel('p', { innerHTML : '<label>Movement :</label> <span>keyboard arrows</span>' });
	this.dom.attackText = JAK.mel('p', { innerHTML : '<label>Attack :</label> <span>HOLD "space" key</span>' });
	this.dom.blockText = JAK.mel('p', { innerHTML : '<label>Block :</label> <span>HOLD "x" key</span>' });

	this.dom.controlDiv.appendChild(this.dom.moveText);
	this.dom.controlDiv.appendChild(this.dom.attackText);
	this.dom.controlDiv.appendChild(this.dom.blockText);

	this.dom.startButton = JAK.mel('input', {
		type : 'button',
		value : 'START'
	});
	this.ec.push( JAK.Events.addListener( this.dom.startButton, 'click', this, '_letTheGameBegin' ) );
	this.dom.startRoot.appendChild(this.dom.title)
	this.dom.startRoot.appendChild(this.dom.controlDiv)
	this.dom.startRoot.appendChild(this.dom.startButton);
	document.body.appendChild(this.dom.startRoot);
};

BattleMage.StartScreen.prototype._clear = function(){
	for(var node in this.dom){
		this.dom[node].parentNode.removeChild(this.dom[node]);
	}
};

BattleMage.StartScreen.prototype._letTheGameBegin = function(){
	this._clear();
	this.game = new BattleMage.Dungeon('canvasMain');
};
