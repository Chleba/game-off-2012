
BattleMage.shootNPC = JAK.ClassMaker.makeClass({
	NAME : 'BattleMage.shootNPC',
	VERSION : '1.0',
	IMPLEMENT : JAK.ISignals,
	EXTEND : BattleMage.NPC
});

BattleMage.shootNPC.prototype.$constructor = function(){
	this.$super.apply(this, arguments);
};


