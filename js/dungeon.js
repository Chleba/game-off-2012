/**
 * Simple canvas dungeon game with discreet shadow casting algorithm with many thanks to Ondrej Zara <ondra.zarovi.cz>
 * Made by cHLeB@ <chlebik@gmail.org>
 */
var BattleMage = {};

RPG = {};

RPG.N				= 0;
RPG.NE				= 1;
RPG.E				= 2;
RPG.SE				= 3;
RPG.S				= 4;
RPG.SW				= 5;
RPG.W				= 6;
RPG.NW				= 7;
RPG.CENTER			= 8;
RPG.DIR = {};
RPG.DIR[RPG.N] =  [0, -1];
RPG.DIR[RPG.NE] = [1, -1];
RPG.DIR[RPG.E] =  [1,  0];
RPG.DIR[RPG.SE] = [1,  1];
RPG.DIR[RPG.S] =  [0,  1];
RPG.DIR[RPG.SW] = [-1, 1];
RPG.DIR[RPG.W] =  [-1, 0];
RPG.DIR[RPG.NW] = [-1,-1];
RPG.DIR[RPG.CENTER] =  [0, 0];

RPG.NONE = 0;
RPG.NPC = 2;
RPG.WALL = 1;
RPG.YOU = 3;
RPG.END = 4;
RPG.BLOOD = 5;

RPG.HP = 500;
RPG.speed = 5;

RPG.STYLE = {};
RPG.STYLE[RPG.NONE] = {
	img : './img/none.png',
	//img : './img/bg1ground.jpg',
	color : "rgb(255,255,255)",
	width : 30,
	height : 30
};

RPG.STYLE[RPG.WALL] = {
	img : './img/wall.png',
	//img : './img/bg1stone.jpg',
	color : "#000",
	width : 30,
	height : 30
};

RPG.STYLE[RPG.NPC] = {
	img : './img/bluecape.png',
	color : "#FFF",
	up : 0,
	left : 0,
	right : 0,
	down : 0,
	width : 30,
	height : 30,
	steps : 1,
	interval : 0
};

RPG.STYLE[RPG.YOU] = {
	img : './img/man.png',
	color : "#FFF",
	up : 0,
	left : 0,
	right : 0,
	down : 0,
	width : 30,
	height : 30,
	steps : 1,
	interval : 0
};

/*- min/max for array -*/
Array.prototype.min = function(){ return Math.min.apply(Math, this); };
Array.prototype.max = function(){ return Math.max.apply(Math, this); };

BattleMage.Dungeon = JAK.ClassMaker.makeClass({
	NAME : 'BattleMage.Dungeon',
	VERSION : '0.5',
	IMPLEMENT : JAK.ISignals
});

BattleMage.Dungeon.prototype.$constructor = function(rootElm, map){
	/*- Statistika FPs -*/
    this.Stats = new Stats();
    this.Stats.getDomElement().style.position = 'absolute';
    this.Stats.getDomElement().style.left = '0px';
    this.Stats.getDomElement().style.top = '0px';
    document.body.appendChild( this.Stats.getDomElement() );

	this.opt = {
		allMap : 0,
		radius : 7,
		visibility : true,
		step : 80,
		pointSize : { w : 30, h : 30 }
	}
	this.direction = RPG.E;
	this.HP = RPG.HP;
	this.dom = {};
	this.ec = [];


	var mapDef = "{\"mapSize\":{\"x\":\"35\",\"y\":\"35\",\"w\":\"32\",\"h\":\"32\"},\"style\":{\"1\":{\"constant\":\"1\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABWElEQVRYhdWXsRHDMAhF2cNlSpUuPUCG8AAZIwOk0AAellTOEcQXIJ1zl4LGZ/AL8PUVqvXg5/P1FbUevO8PLmXlbbt/opSVaz2+4nxfP4vmk/64jGgRK6L5JBPOXzMLIet4+Q2A14lSVi5l5WW5pSDkx2U+oSQEISMCoXdK51OvnRbEstyaQhkImb9tdyZvpj2I7E5Y6qJMkdHFlF3QEJTd7lkInU8jEhuBQIcd6SLeYs0cVpa6aERio+cEBEASQ0V0MUtiqJMQwILoGRCaaUSiECAzUy0tpHNvsU0vmLHiLETjBRkI1IUMBATIQmg7j0KQJspKDAFE8xuAHgSSaO8u4bmo2QEEgYp4AD0XHb4P6JlGIfROuPeBjDpGIC6/D3gQ/3UfiMw066LmfeAKK0bjIHliXW3FFsjnHBj1cwsiM06yivzKihuATJFZFzzD/Hf8Kyuu9eA3lPYjgLgxCxoAAAAASUVORK5CYII=\",\"solid\":false},\"2\":{\"constant\":\"2\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAwklEQVRYhWPYvHn3/8WLV//v7589IJhh1AGjDiDGAYcPn6YZJsoBly/fphkm6IDFi1f/r6/vphkm2gHW1u7/+fmFqY5JcoC0tDJVMUkOkJZW/m9t7f5fW9uYalhaWnngHAAL0aHlAG/v8IF3ALVCYeg6gFqOINsB0dHpg8MB1MBkOwAWFZRiihxAjbqBYgdISytTlA4G1AEUpwFKc8KoA0YdQDUHWFu7k1UIUT0E6F4UwxyA3MAkpQSEYao4AN1QUjAAiNGrtf1wPVYAAAAASUVORK5CYII=\",\"solid\":true},\"3\":{\"constant\":\"3\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABJklEQVRYhe3WsRWEIAwGYPagpKS0ZAALBriCARyDASwcwJLS0vKGy1XxcVxQuZdQ3Lsipfq94E+i9v0JKW2wLCtZKW0Q4wxaG/D+ASFM4P0DnBvB2gG0NqCUensmxhlCmMDaAZwbj7J2+Hi/kgC0IEQAMc63EaIdyBH5x/E5UQB+HCHYiby0NrIACqG1OQDOjfKA/DjyTuCRsAGoiFFdKBFsgFrOSwQWIlgBZ4gSgJ1gB7QgYpx5/wEq590AZcSwrhCsMcwRZ8chBqByfpUOkYuoBSF2E3bfB/J8lwOoyz5QAsobrxZRdgBVZxHtAigR+XF0A9TWM9YUfIMQ3weuEL+3D1BT8AzB3oHaKK4dBxvgziimICL7wJ0pKLYPtIzi/z6wLCu8ANQbGYgMDT9tAAAAAElFTkSuQmCC\",\"solid\":true},\"4\":{\"constant\":\"4\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB7klEQVRYhbXXLbLCQAwA4NygArmyciUC0QNUVCIQKxAIJEfYA1T0AMiKJ5DIJzkKB+AAiCDephN29i8LT8QwQL7JNpsUbgD4SMQNAEcAVKrFMwAac8Rh2GHX9aj1GpVqEQBwms5LWDuiMUfUeo1d1y+h9frte9N0RngA4NPso4EOQYARIAuQIICSxOJp9nj3ABYgW4FSRDXgBJCtAEfw5PS7jwEH93kIQMkJQpXgoVRbDti4pNYDbAGigBBCqXYBdF0vA/QuTh6gTwD4cfBK0JGIAE2zWiAHDxBqsVAVfIQYwBFbBoj1uY+gIEQVoGlWqAFQs6NJXTYhAFWiGsCrsWEACcLaEeHHJUklP7kkuXKG+vzrAH7BpFqMIof4SgVCiNRxfAwItVasz3PdUQ3wL5haRDEgdNnEqiBBFLdh7LIJPQv+APrKPrB1FfBbLAYobdEqQA4RuidiLSoCxP4kB/AR/DhEgFSflyL8Z0IEyO14NQgRgHYASZ/nEOKd0LpLyT+Kf98HCEC7IS2kTbN6Q4SmYApRBSAEbUP8koqN4ug4lgIODMAX1ZJRHJyGd/h79UoFAfg2TBCqQuko9hFwvf7iPF+iX5znC1o7olLtW/l9QM0oFgOGYYfGHBcIJeejWrwP1ADo7Zgg/q4gQbwAwfxi51vI9HMAAAAASUVORK5CYII=\",\"solid\":false},\"5\":{\"constant\":\"5\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABhUlEQVRYhb2Wr5nDMAzFtUFAoWGgYaAHMPAAARmgY3iAgA5QWHhjFB4svGF0SPlUnf/IrnPgoXxxfpH89AS32x1Lejy+MMYdjZkxhBW37YohrOicR2sXNGZGAHh7J8Ydt+2K1i7onD9k7fLnfDgDoAXiFIAYdzXEqRXgEPzj9N6pAPRxAqFKcBkzIzyf31hTL0AKwpj5AHDOI7xeP1jTJwC8HbwS1BIgwppqACmLpaogIWCaLqhVCSDncwlBIggwZkatagAlCAlAlQB5M0vSALRAxLi3ATjnMYQ1ewdSPv83AGkxUg2iCYDakLMhhyi14yMAqkJuDmhT8MiC0QCtEM0A1IbaJFTvA6MAuL9lABX3Af5QKw2AnHg5iwLd6hbxv5EAKZUs2pQFXHSgBkBC8B/ougNcWoDcejYMIDdqaxDDAHI+r0EMA+jeB0YCOOeTKViCGF4B6fOhcVwC0ERxMg17BhEfSKl9QJOCB0DPKE5Nwp4ofmtB70ScpsuYfSB3sFa9+8AvW/7WqON+c0gAAAAASUVORK5CYII=\",\"solid\":true},\"6\":{\"constant\":\"6\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABhElEQVRYhe2WsRHCMAxFtRcDUDAARQag9AApPECKDECZkjEoKSkZxhScOOXnS3ZIkYZCl0ssSy/fkhIZx2vZ0+QP8Ae43x9lT5Pn81X2NMl5KHuanE7nssUOh+Om/dJ1l7LGWoJa/5T6MJ7UHFqAovWU+hkE5vsC/ArSCuDFF+uY8+AG6bpLyXlYBIoANLHG1f02xkwBBqDP9Yo+rQA2+QKAOUWBagA2EcZGELEOGhyLhgGoD6t69Gem+xcK4Dl7b4IqWbAIAutioYCX3FPAAtSSsxyim3ExCrYFANdmClhpokLyAGzXYFIGkFL/+Rhhq9XkZ0XIktk9bhcwmdYowABafkR0TxXAO0dUgw2snAea3KpA2xCnYHSm6GfV8JLbGK4CEQBTi7VYy0fKVaB1ojEAr1PcUYwLUQ14xeT1O3sZCmDNkx/Pchyv1YHDuqkK4AVlRVUr1FUAbCghAF5bAFirzgaRN3DsvW0he89qAHs9VIAlY0AIwPpebZpuZZpu4STU+G9/IOJsaTTbFQAAAABJRU5ErkJggg==\",\"solid\":true},\"7\":{\"constant\":\"7\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABIUlEQVRYhe3XqxHDMAwGYO9hGGhomAEKPECBB8gYGSBAAxgaBgZ2OBU5p/r8ak9KQQtEernLl1TyryiAgOu6vRRAQO8XNMbiPN/OMsYiQECAgEop1Ho6r3Hujt4v6NwdtZ5wXTeMcT+vzyvGHY/jgSq/Oa0Wgg2QfqBPP4IQA/TehDFWBpAQNUxCsANoY+VVQqSbsgHy7h5FsAJ6iFJjsgPeRbD2wCcINkA+56nLLwOURswYi1pPTQT7UUxHrIVIZ4VIFuSIWk+IvIGRAKIlmgUjCLEsGEWIAy7fB0YQdDrEAC2ESBzX5rwVxb+1D9Sm478PfGUfEAGU9oFeFLMCAMLwPkBHlP0cKO0DtSgWiWOK6PWEGID+HZftA71vQel94Aml0xZEAeqPvwAAAABJRU5ErkJggg==\",\"solid\":true},\"8\":{\"constant\":\"8\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB7klEQVRYha3XIbKDQAwG4P8GiEpk5UoEogdAIBEVKyoqkD0CB0BwACTiicrKJzlKD/AOUJFnSCeku8AuFZnpdOjkA5JNiq7rqWnaWXRdT9bWZExGp1PxDmMy6rqeuq4nAJSmx/c1ZXkma2vqp+9bgEaA/hZiBAg6uYwlhAvQAm/ACBAB9LIXb/wBBL4jefdbEBrQADPAc0pOE8QVL3v5BKw9CWOyD8AN2A9ghA/DCA24AvsAsrB0uBB81wCoAmaAZvqcA9sBurq3IgoFuAFUTBEMWEO4ClMCriJxkhziAKEIBlQqeTBg6bBZQnBSMwUnDwboPucqXwPk6q6jAa4WMyajND0GFaY8J/KpKJcQL3uhH4ijWLbYEsJ1VvDs4N9HAVwIX024DiqJiAasDSAXQn9vbR0G8PX5VoSrRqIAMQjfUyi+AQhFSEwR0oahLaa7wwWo9gCWEL4W1dfvAvh2Atc5wa9jFyB2H9A1EQ2IGcW+wowGfAvBu0EUYA+Cj98GkTvhVoSuiSQ5zBbTPAbg2ge2jGLe/yqRPArAA2TLPiBbVC6gDLjGAvQ8133uewKVSCy3YwaMK/GEGMcSsWUKaoB8DWl6pKZpaRju3lc5DHd6PH7nAPk61hC5qAFObG1NZXmOA4ROwVwkln/PQwH/nN1ob96G2wAAAAAASUVORK5CYII=\",\"solid\":false},\"9\":{\"constant\":\"9\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABgUlEQVRYhb3XoZXDMAwGYG0QUGgYaBjYAQ54gAAP0DEyQIEHCCzsGIUHC28YHXLOcWRJjt0D/3sFfckXx5IVCGHFZbnvEsKK3t/Q2gmv168t1k4YwoohrAgAaMy4/ce5Gb2/oXMzGjPistzx8Xhu/y8F8pun4RDdAPFH+vQaxMcA0kpYO30GEBElTER0B6QbKw+FiDfVAF6vbzGQ724tQgN4v3/EAFViEsT7mwqgCZTqXEJwgGG4qANcs+EQ0gpoA3mdx13eAkirRQpQJWbthMaMLIICODfvHkINyEuMQ8Re0R1AIUp7gluBmpsfANIBtOtgBKD26a2d6LNAg+gOqEVQgNqbs4Az80AzQEKk1VF6BbU5ADjETp4B0kqoCbkC0lGcA4wZq/r/4SxonQdaIs4DperoCmidB7oAWuaBJgDXbP4FQM0D0lHcFRDCqp4H0hLtCogI6oLSCpxtQFsjyj9I40W5PUHNA2ezA6SvQzMPnO1+w3D5ewW1X8UpQBsO8Asz29NkBrEy6gAAAABJRU5ErkJggg==\",\"solid\":true},\"10\":{\"constant\":\"10\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAwklEQVRYhe3WIRLDIBCFYW4QUYmMjKzcAyA4QEQO0GPkABU5QCQyMrIysjKyh9kqZnBdyGOYDohf82Wy7KCWZeUSObfxvr9YNUADHMebcyUCnOeHc+Xc9hswz0/OlQjQdTdGp3UvB2jdc46iAMNwh0Vk4gFEBgawdqwYQGQqB1g7lgMQGZ6mxx8DECUD/L+7WjLgys4Ppz8ZgLp+xYawXgBsBhogBeBfPjBAzMLxrx4oQFr49TCAdBuGByulsIDYUIAvsIOp1yBWWjkAAAAASUVORK5CYII=\",\"solid\":true},\"11\":{\"constant\":\"11\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAfklEQVRYhe3VoQ2AMBCF4bdBBfJkZSWyA1R0AMbpAAgGYJxKZCXDPBQKScJLyInff+ldrti2ncrgAAf0flAZxjipDK2tVIYQJiqDWaQypDRTmQMc4AA9IOdCZah1oTL9X/BmfmaRORfdEjrAAf8AyA+R/BTfT/H1BXzsgApwAZzbbUbVa46uAAAAAElFTkSuQmCC\",\"solid\":true},\"12\":{\"constant\":\"12\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABxklEQVRYhe2WvXHDMAyF3x4qU7JUkcKNOw/gUkUKFy45ggZgoQE8QBbwBhzFA2SAFEgjKDAEUJSiFLlL8e50JxH8RPw84gMgWqn3gtbEeQCELQB76R/g7wJ8dm+uVgPkhYCWSl2wJk4GCAmgPNLUKhZUGyMDlADCBSDWSTy//oIuhpBGkjT+QVoR8OTobCiKfaSQxtw98D3JIkDDcDPV9+lJXXelEFo6HE6TQmhn66z0zABkjpvmZRNECC2F0M7WR1WsiwBWEN5cQwzDjbruSk3zMgGwNEBaAsgCwDtOfQIWhE5HNH70CYDbiJ+Xcio3lvJqQqYgSgB+gfuRcD9OH9QUlgXgQcgUmAD6BGqq2zsFCyKK9JoAnBcGqG0xqxZkTfB6BuCpm60TOCuAmhbzAPR6eQJnDyAaADKIVAnCmhN6n1UAHMTr8yWAvk/LAJwf/sibeF6f1wBkpWINeIVWKswaADanCcAbRKXpV2tAcp3bhkm98AB+AiFHsQsg72o1AB6E56JR7TMD0CaxpxVLANOMsnqZYN8HtlrxKgCuTivIVivWALkGYE8rlgAzL5AA2QDYw4qlF8wGEc8BKU7BXlYs7wN6ny/p/+48ESt6qQAAAABJRU5ErkJggg==\",\"solid\":false}},\"mapArray\":[[\"2\",\"11\",\"11\",\"11\",\"11\",\"11\",\"10\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"2\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"10\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"10\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"2\",\"11\",\"11\",\"11\",\"12\",\"11\",\"11\",\"11\",\"11\",\"2\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"10\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"7\"],[\"2\",\"11\",\"10\",\"11\",\"12\",\"11\",\"10\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"4\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"7\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"8\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"2\",\"11\",\"11\",\"11\",\"12\",\"11\",\"11\",\"11\",\"10\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"7\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"7\",\"1\",\"1\",\"1\",\"9\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"5\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"9\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"10\",\"1\",\"1\",\"2\",\"11\",\"11\",\"11\",\"12\",\"11\",\"11\",\"11\",\"10\",\"1\",\"1\",\"2\",\"11\",\"11\",\"11\",\"12\",\"11\",\"11\",\"11\",\"10\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"2\",\"12\",\"11\",\"10\",\"11\",\"11\",\"11\",\"11\",\"11\",\"10\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"2\",\"11\",\"11\",\"11\",\"12\",\"11\",\"11\",\"11\",\"10\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"11\",\"11\",\"11\",\"11\",\"12\",\"11\",\"11\",\"11\",\"11\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"11\",\"11\",\"11\",\"11\",\"11\",\"10\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"2\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"10\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"11\",\"11\",\"11\",\"11\",\"11\",\"10\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"11\",\"11\",\"11\",\"11\",\"11\",\"10\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\"]]}";
	//var mapDef = "{\"mapSize\":{\"x\":\"25\",\"y\":\"25\",\"w\":\"32\",\"h\":\"32\"},\"style\":{\"1\":{\"constant\":\"1\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABXUlEQVRYhdWXwc3CMAyFvUePHHPsDQZgBxiALWAApHaADuv/VGQcv9hOVKT/4EtVux+2X16gddn49Xx/xbpsfL89uJSZL+frJ0qZeV22r9jf18+i+aQ/LiNaxIpoPsmE/deMQsg6Xn4F4HWilJlLmXmaTikI+XGZTygJQciIQOid0vnUaqcFMU2nqlAGQuZfzlcmb6YtiOxOWOqiTJHexZRd0BCU3e5RCJ1PPRLrgUCHHeki3mKNHFaWuqhHYr3nBARAEkNFdDFLYqiTEMCCaBkQmmlEohAgM1MtLaRzb7FNLxix4ixE5QUZCNSFDAQEyEJoO49CkCbKSgwBRPMrgBYEkmjrLuG5qNkBBIGKeAAtF+2+D+iZRiH0Trj3gYw6eiAOvw94EP/rPhCZadZFzfvAEVaMxkHyxDraii2QzznQ6+cWRGacZBX5lRVXAJkioy64h/nv+FdWvC4b/wE3nSA6R6yWIAAAAABJRU5ErkJggg==\",\"solid\":false},\"2\":{\"constant\":\"2\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAwklEQVRYhWPYvHn3/8WLV//v75s9IJhh1AGjDiDGAYcPn6YZJsoBly/fphkm6IDFi1f/r6/rphkm2gHWVu7/+fmFqY5JcoC0tDJVMUkOkJZW/m9t5f5fW9uYalhaWnngHAAL0aHlAG+v8IF3ALVCYeg6gFqOINsB0VHpg8MB1MBkOwAWFZRiihxAjbqBYgdISytTlA4G1AEUpwFKc8KoA0YdQDUHWFu5k1UIUT0E6F4UwxyA3MAkpQSEYao4AN1QUjAAA3SpuxMZ9tMAAAAASUVORK5CYII=\",\"solid\":true},\"3\":{\"constant\":\"3\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABK0lEQVRYhe3Wuw2EMAwG4OyRMmVKOhgACQZAggFuizAAEgxASUlJecP5KqNczuFxslOcrnAJfHL4Y6tte8KyrDCNM1nLskLvBtDaQF010LUPqKsGirwEazPQ2oBS6u2Z3g3QtQ+wNoMiL/eyNvt4v5IA3EGIAHo3XEaIdsBH+B/H50QB+HGEYCf80trIAiiE1mYHFHkpD/CPw+8EHgkbgIoY1YUQwQaI5TxEYCGCFXCECAHYCXbAHUTvBt5/gMp5MkAYMawzBGsMfcTRcYgBqJyfpUPkIrqDELsJk+8Dfr7DAZRkHwgB4Y0Xiyg7gKqjiCYBhAj/OJIBYusZawq+QYjvA2eI39sHqCl4hGDvQGwUx46DDXBlFFMQkX3gyhQU2wfujOL/PjCNM7wALusWuCptJVYAAAAASUVORK5CYII=\",\"solid\":true},\"4\":{\"constant\":\"4\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACHUlEQVRYhbXXPW7CMBQAYMcObaUghZbRY8ZILGzhAEhwgEigDp3gAqwwMSG1EitjRoYOjD0DV+ECDK8Lz3Jcvzg2dHhbiD895/3AzkkXrr1XMs5JF/adJ5Ayg+r5GeazBUwnJYyKMeT5EKTMgDEGX58HFZv1DuazBeT5EEbFWEWeD2vPfX0egF17rwDvH3S89eGcdBVg33lyAnwQDA8h4/0DLmmvBtjGsTMDbRHBgJUQzgzoCP1w/N3dgCUXJAAPRwhmQg8ps/aAIopgJQRs47gGKDknATaElJkCjIqxH2B6i5UQNcA0ikiAfh16JvBKvABp2leQJa8DbCVmy4KJ8AboiJJzBaDq3ERgICIIkKZ9GDAGA8YUpqnZ2ACYiWCAno1CA/ggNusdsO+XFyARt8NXQkChfWhUOm11/nCA3mCaSgzDhXhIBmyIpuu4G2ArLarOXdURDDAbTCiiNcDWbKgs+CBalyHVbGzfgjmAHrIPlJxbS4wCtC3RIIALYesTVIl6AaiXuAAmQr8OL0BTnbdFmN+EF8C144UgvAC4A/jUuQvhvRNu4xiKKPpzFf++DyAAd0NcSNO0X0PYpmATIgiACNyG9CZFjWJyHPsCllwogL6othnF1ml4SXtwTrqNgQB9G0YIZqHtKDYR7HT6gao6kg9W1RE26x1ImdXSbwJCRrE3YDopYT5bKAgero9q730gBID/jhFi7go+iF+2d4fgxe2AjAAAAABJRU5ErkJggg==\",\"solid\":false},\"5\":{\"constant\":\"5\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABjElEQVRYhb2WvXHDMAyFsYEKlyxZslRHDcA7aQDd2QN4C2kA3SUDpHSZMVymdJlhkAo6mOYPSFMpXqUT9QngwwN8fnxhSrfbN67LhkppnMYZL+crTuOMg3VoTI9KaQSAp3fWZcPL+YrG9DhYt8uY/uV8OAKgBOIQgHXZxBCHVoBD8I/Te4cC0McJhCrBpZRGuN9/MKdagBCEUnoHGKxDeDx+Mad3AHg7eCWoJUCEOeUAQhYLVcGHgK47oVQpgJjPfQgSQYBSGqXKAaQgfACqBPg3MyUJQAnEumxlAIN1OI1z9A6EfP5vAL7FSDmIIgBqQ8yGHCLVjrcAqAqxOSBNwT0LWgOUQhQDUBtyk1C8D7QC4P72Ayi5D/CHUkkA/IkXsyjQrS4R/xsfIKSURYuygIsOlAD4EPwHqu4AlxQgtp41A4iN2hxEM4CYz3MQzQCq94GWAIN1wRRMQTSvgO/zpnGcApBEcTANawYRH0ihfUCSgjtAzSgOTcKaKH5qQe1E7LpTm30gdrBUtfvAH7K61IG96/0CAAAAAElFTkSuQmCC\",\"solid\":true},\"6\":{\"constant\":\"6\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACRUlEQVRYhe1WrW7rMBQ2KqpkEBiWwsKx5AEiJQ8QqXmAsJYNpNImFYRMWh9gqBq8rPDCDRQUBAQUBBRUe4LAgO+Cq2PZjt06k+4tGfjk9uT4+PP582Hb1zfcE+yHwA+Bz88j7gnWNC3uCfb89IJ7gkVhjPn8QYBz77+CRWGM/fmCuusGBHx/JqD/J0ymzPrNBSwKY9Rdh77vFQKuBv4Jgfn8AVEYO2EyZaP0dRhD4PszJS+uYTJlo/R1sCiMsa0b7M8XRGGsELjF3kTY9eaCQJpkyBcFojBGmmQiNi4GiDD9lknoN7XtZ2mSoe46fEk5IHsgTTKslmulfa6Wa6RJpnjsGnRySg4QAVsSrpZr9H0/wPPTizOB1XItSBNxKwG6vUsYZMj65DUK6dUqyBeFMQS2zkXkyPD29U1UA+ce8kUB35+JlXMPTdPi/f0X8kUx8BhLkwybwxH78wX5olC8IIeC5HKj0lcTOPeU3NGrhunZSpvoRjYvyJ7QodsyEabvLE0y7E4t9ueLUobyQbpXTI1HP9y2d9CIKAmpE+qGbvWC7zQheb+xCsa01rGt2+oB/TV0xbVccZoHbJ3Q92cIygpBWSm9QZfZ9F1lIgnl1zBNMgRlhW3dYHdqEZSVUUad0FXfJGNRGGNzOGJ3av/GhDFEYYygrPD4+wObw1EcZpKN0ScCssw4E9JKruLcE7c1yVz10yQbyMRE9NX3g3ngFmgk+24ViJFMzwHbQGIyQiOZ6e032aDXkM4ahEDP7FsYO8Tqe/8ARo34WiIAmGcAAAAASUVORK5CYII=\",\"solid\":true},\"7\":{\"constant\":\"7\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACL0lEQVRYhe2WMc6jMBCFp6JCokjpkpIyHRwAafcAK8EB6PABkOAASHAASpeUlCkpU6b8D0CRQ8wWu+O1jQ0krJTmL15D4pnPb54N0HcDflLwDfANMM93/KTg8fjCTwqausVPChgLMQguK3k+YBBckLEQPR/w549fL8nzARkL5Xqqp4qx0A1AENScl5WmvZ3xspLrAf7ICmBrzFgod5FnBfbdgEKMOE23l8TLSqtp6wU2+5I4Rc8H5GWF03STiTUDZEu1+bzvBgyCi3NUQHNiLJRWUXNXYxNgD4wgpO1/+zAWIiRxikmcrnZu7uod2SCoH0k6EEVX9HzApm5PNd1yoqlb9HzAKLr+c109Kk3dOosJMR66WoUYN6EIQgPwfMC+G5yL8qzAKLrKUbmUxClG0RXzrNiE6LtBQgDNZWsBL6vd5ioEL6vd8SRxqh/Dx+MLl+W5EgHkWXFYvKzkWldNchXooqGgUIE8K3Ce7/JCUe+DPTV1i8vydNakPGkAQow4z3fZjAJpK/gqAC8rFGKUx3uabth3A+ZZoTuwLE/ZmEJJZ/hdAEo+PVeDmGcFAi8r7fiYfz7rgKumBGjqVju79KZTg0QOHHkX2ABok2ZNbQRbiXUBbJ1zAjBr0XMrAAWGHFDv8XcAVFfJgVUG9gDOOGADUDe1AjBnqxagwkekztpVVwOgIP5PLcvT+VvfDdjUrdsBU7Zw7snmpDmmwwBn5DqqhwHOfhW5QIQYMc8K/A3S1VQQZv5vcQAAAABJRU5ErkJggg==\",\"solid\":true},\"8\":{\"constant\":\"8\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAxklEQVRYhWPo75v9fyDw4sWr/2/evPs/w6gDRh1w+PDp/7TCRDng8uXb/2mFFy9eTdgB9XXd/2mFiXIAP7/wf2pjaWll4h0gLa38nxaYJAdoaxtTDVtbuZPuAGsrd6o5wNsrfAQ7wNrKfYQ7wNsrfOAcYG3l/j86Kn0IO4AamGwHwOKOUky2Aygp85FTP9kOoFb2G7BEOHIdQLU0MOoAchwAa/lQzQGkFDiwVg9VHUAsRvY91RxAbGmIbDEDAwN1HUAqppYDAHRep+OCSaw+AAAAAElFTkSuQmCC\",\"solid\":true},\"9\":{\"constant\":\"9\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABJklEQVRYhe3XOw6DMAwG4NwjI2PGbO0BKsEBkOAA3KIcACk5QEZGRsYezp2C3CivVjYd2sFLhcQHtfMbYY2D+b68lDUOxmECpTRcL7ejlNJgjQNrHAghQMrmuKZrexiHCbq2BykbmO8LrOt2XB/Wum6w7w8Q4c1x5RBkAP8DfvoaBBug9CaU0jwAj0hhPIIcgBsrrBjC35QMEHZ3LYIUUELEGpMc8C6CtAc+QZABwjn3XX4aIDZiSmmQsskiyI9iPGI5hD8rWLIgRKR6guUN1AQQLtYsqEGwZUEtgh1w+j5Qg8DTwQbIIVjiODXnuSj+rX0gNR3/feAr+wALILYPlKKYFGCNq94H8IiSnwOxfSAVxSxxjBGlnmAD4L/jtH2g9C3IvQ88AQMSE3nlWILWAAAAAElFTkSuQmCC\",\"solid\":true},\"10\":{\"constant\":\"10\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACKklEQVRYha3XvW7CMBAHcH8EWgmk8DFmZIzUhS19gErkASKBGJjgBVjLxIQEUlfGjB06dOwz8Cp9AYZ/h+qCY+wkdhhuQUH3c3xnX9jpeMbu/VCK0/GMxXyNOJ7iNXkrIo6nOB3POB3PYIwhiibFM+ksw2K+Rv70hCia4KPTxaXXx3UwtMal1wfTk6tRhTABPjrdAnDp9YHRGFiurHEdDMFoRerqmyB0wD4ISoDfcPCfaDS2x3J1D6h7E3E8vQNspWwPIIQNQwgdsBGyHUAtLD1MCFo1YwyZECXAPgiwlRIJ580BenU3RaSclwBbKZFyjpRzd0AdwlSYKmAjZJE4DMd+AFcEATIhSsmdAVWHTRWCkr4whhfGiuTOAL3PqcrrAIm2am+AqcXieIoomjgVpnpOJJxjK2U1YrnC1/Pz7ShWW6wKYTor6O6g/3sBTAhbTZgOKhXhDai7gEwI/ffFfO0GsPV5U4SpRrwAPgjbW0gfAXBFqJjUpQ1dW0zvDhMgE8IfUIWwtaj+fCuAbSYwnRO0Ha0AvvOAXhPeAJ+r2FaY3oBHIWg28AK0QdDxuw8Cv5mwKUKviTAclwbThHN3gGkeaHIV0/yXCVEk9wLQBdJkHlBbVB1ACbAR0v+7oKrPbW8gE6JIrE7HBLj0+pXxGw5u17GKaHIL6gB1G6Jogt37AXn+ad3KPP/E9/dPGaBuRx0iUWqAEi/ma6SzzA/gegtS0oTz0ue5K+AP8baNZWkiMsoAAAAASUVORK5CYII=\",\"solid\":false},\"11\":{\"constant\":\"11\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABh0lEQVRYhb3XMZKDMAwFUN2AIqVLSpd0uwfYGTgAM+QA3CI5QGbgAJQp9xgpt0y5h9FWJsbIkoydLf5Migw8jCULmKcFr5fbJvO04HkY0doGPz++1ljb4DwtOE8LAgAaU6//6doez8OIXdujMTVeLze837/X/8cC4c39cIhiAPfDf3oN4m0AaSWsbd4DcIgYxiGKA/yNFYZCuJtqAI/HjxgId7cWoQE8n79igCoxCXIeRhVAE4jVuYTgAFV1Uge4ZsMhpBXQBsI6d7s8B+BXixSgSszaBo2pWQQF6Np+8xBqQFhiHML1iuIAChHbE9wKpNx8B5AOoE0HIwCpT29tQ58FGkRxQCqCAqTenAUcmQeyARLCr47YK0jNDsAhNvIA4FdCSsgVkI7iEGBMndT/d2dB7jyQE3EeiFVHUUDuPFAEkDMPZAG4ZvMvAGoekI7iooB5WtTzgF+iRQEOQV1QWoGjDWhtROEHqbsotyeoeeBoNgD/dWjmgaPdr6pOr1eQ+lXsA7ThAH9iKtFCI6/nzgAAAABJRU5ErkJggg==\",\"solid\":true},\"12\":{\"constant\":\"12\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABi0lEQVRYhe2Wsa2DQAyGPVfeAJHyBnhSMkA6GAAJBkBKBkhJmTFSpkyZYe4VkSPz89t3hIImhYXgfPbHf7ZBzqdLWtPkC/AFuN3uaU2Tx+OZ1jTp2j6tafK7+0tL7GezXbRfDvtjmmMlQa1/XTVhPMk5lABF63XVjCAw3xvgU5BSAC++WMeu7d0gh/0xdW0/CRQBaGKNq/ttjJECDECf6xV9SgFs8gkAc4oC5QBsIoyNIGIdNDgWDQNQH1b16M9M908UwHP23gRVsmARBNbFRAEvuaeABcglZzlEN+NiFGwJAK6NFLDSRIXkAdiuwaQMoK6a18cIWy0nPytClszucbuAyTRHAQZQ8iOie7IA3jmiGmxgdW1Pk1sVaBviFIzOFP2sGl5yG8NVIAJgarEWK/lIuQqUTjQG4HWKO4pxIaoBr5i8fmcvQwGsefLjWZ5Pl+zAYd2UBfCCsqLKFeosADaUEACvJQCsVUeDyBs49t62kL1nNYC9HirAkjEgBGB9rzYM1zQM13ASavx/gl/erq8i9D8AAAAASUVORK5CYII=\",\"solid\":true},\"13\":{\"constant\":\"13\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAgElEQVRYhe3VoQ2AMBCF4bdBBbKyEolrB2gCA7ANDEACAzBOJbKSYR4KhSThJeTE77/0Llds605lMIABSjmoDLWeVIZ5WqgMzjVUBu8DlaFtOyozgAEMoAekmKkMQz9Smf4veDM/7wNTzLolNIAB/gGQHyL5Kb6f4usL+NgBFeACp45r///ZQ6cAAAAASUVORK5CYII=\",\"solid\":true},\"14\":{\"constant\":\"14\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB90lEQVRYhe2WO26DQBCGF1YgJJBMkpLS5ZZ09gFiyQewZCtFKucCtPYBLNkSrQ/h0qfgKr5Aikk1q2GZgcWhiZTil5FgZz7Pc9V3/gLw+jZKtyQRNcbOY5aDegZgKv0D/GGAj09ZYwGaNOs3yKi3C0bYadIMVB3F0KQZPGa5tyqtRfnaaNIM6igG9RVqQK2DwD4vgmByUV8oVUcxoCqtoY5ib4NrQZsw7Ahtu1J1FMMtSeAxy+0kq7SGy/nK6ng4tbTb7sGYEpaLdytjys45Lj0dAJrjopg/BWFMCcaUnfOV1q1iHQTgjKBzF+JyvsJuu4eimFsAlAtA/bEATZpZACmcbgQ4CDcdCCCmANsIn4dySh1TSTVBU4D1UEcxKHyh7itQ95X9wKewOAAJgqaABXAj4FPdUhQ4iEprm14WAPOCAL4txtUCrQk8jwA4de0kpP96E4YtAJ8WkwDc8zQCmzDkAegzZ4SqD4KbE66fUQBoROrzIYDj4TQMgPnBj6SJJ/W5DwD6QPXWgFRofYXpA4DLyQJIg6hv+vkuIHpObEO8kAwB/AaCjmIRgN7VfAAkCGmLYgTofbAF4C6JKVcxBWCXEZ1Q+GLKVTwKAKuTM/LsKnYB8LcXYMpVTAE6u4AC0AEx5Sqmu6AziHAOUGEKplrF9D7g+vkBhWIocCMeJFMAAAAASUVORK5CYII=\",\"solid\":false},\"17\":{\"constant\":\"17\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABu0lEQVRYhe2WPY6DMBCFX5UqkgtKl5SU6eAASMkBIsEB6OAASMkBIu0eYI+TcsuUe5hJs2M9jPlRIKJJ8RQ5Y898nrEH4/vrR7YUPgAfgPv9V7YUHo8/2VK4Xm6ypVAWlWwpGBMJa7fH4jH/NzUfvMhf7Ot0PDv5a0I+Qj79eTAmkiQ5SJbmLi1ZmkuSHDoBeazz2P6qOgAcLEkOPaAszSVLc3eA1LZEszKgY02bwiqIOpsqS0jBDGhAH4gXWhu7+UtAYEwk1sa91HDKszQXa+NBDYHMLgE70/pPaQ7IrEb0auAhCAaZdQt8gLFUv0MdgLGJ2kj8ci0GUKecZr+O2nT8zji3bGOCMZE0dStN3UpZVGJMJNfLTZq6dZOaupXr5dYLXhaVW8e/7G/KDt6J9vuyqARArw0r4Fq7dxlg8b1X4tPx7E43n4cQCPsBuh8iAG6NjoMAeiY09Qqx26MTxJcGUD8MaG08DBA62dqay6LqQLBdO2boKqstZOdN9gAACIBRiFX7gEvFf1Ct2xAEg6z2HvABtFYAOh8lhljtUeoDhErBNX/LozQEwBAhG0MtfhFx2oeul3+n19ITYQqkZkM1Ng0AAAAASUVORK5CYII=\",\"solid\":true},\"18\":{\"constant\":\"18\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA+0lEQVRYhe2WMQ6CMBSG/4mJpANjR8aObHAAEjgAiR7ATQ9gogcw0QN4HEZHRg/zHEixoCA10X9h+EIe72/5aeG94nK+ChMsBhYDdX0TJmiauzDB8XASJlivNsIESkUShBCloo6p2Ec7ZyyCEC+JMb7RvtO7OZRFJUyQpbkwgbscDPgG6FtAL0T0v0DrWJjQDBiTtAaMSeTfaB1LWVRiTNI2o912L8OrxY19tGNjhzFlBVwAPBtGluaiddw1DbtX3X55aJWKevFYrmdAqUgA9CZ1Yx+tfUgQYjIH15n7ddpKNfYWn7Tuvakcvw7QKyG9F9APpfR2POeA+Useq6TFotTj6zYAAAAASUVORK5CYII=\",\"solid\":true},\"19\":{\"constant\":\"19\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABq0lEQVRYhe2WvW3DMBCFr3JlQIVLlylVuiMHICANIIAcgJ01gIBkgADJABnHZUqXGeZcBI850RJFCUnYuHgwJPPuPt4Tf+j97YNLih4AD4DL5ZNLiq7XLy4penl+5ZIiZz2XFO32xFV1CNryfDw+JZWKp92eOJYcIFXXJ9bKcNt0IznruT8P3DZdKNo2HffngZ313DZdKB6L4mQ50soEoSgKwlsJ1DZd6BQKA5RkslzV9Skkk7OekwRAXACYassa5VrwpwC5FsSdzLIg1do1Fkzl0sosb0TO+lkQtHLJAq1MGBtPbHEVAGQKQnqZsgAAWDVyUpRqHWiReMmSVB5AoquASALIBJiVbCGW4xoQCaGVYarrE+cIEAhumy4rLtYdQH8eGMLHhN84GO9TH20qH8CTHZBL0Fm/aZarOjA6mejnMAIA/oPn8B2HU9whxGhlRvmQPxtAQjjrv5cM0d3piPHSHiSXkIiftABfqRyMZ2lHSvGZgEMrzncHsGYJLW3Z2LyWtuURwJb7wJxkkTk568cAJS6iKK6VKXMpRfGqOmy7Ef2Gwsqbu4D+l26plep797RnYQAAAABJRU5ErkJggg==\",\"solid\":true},\"20\":{\"constant\":\"20\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABPUlEQVRYhe2WPY7CMBBGp6JayUVKlylT0iUHiAQHQIID0MEBkOAASLsHoExJSbklJSUlhxmqDwaLgO1xSEPxZNlypKf5c+jvd8d90DR7Phz+mb4CX4Hj8cRd0DR7P4Hz+cJd8UriJrBZb7krvARm0zl3gbeAMRkPfoiNyW7E7OVZVdb+Au7Hr8DdNnAnSGA8mnBKqrJma3N/gaqsOSVFMQwTeBfWUKzN+xOwNufxaNJvCoIFUg0d9H+wQMoOiBJA0WhA+D8igDaTe+Q+SqAohuwLqlyeyeKLEphN57xcrNhdQdseq7oGQiLg4rZflADR/SHBHMfjgxwj/MZkrSJJBIzJmIgeBOQeAvI+ukCdArfK5ePy7CxZF2hngFpA8+4jGiqB2Nkv54F6DsQg60MloP3zUQv4/Iw+g4iSCFwBbebYfPtd9/gAAAAASUVORK5CYII=\",\"solid\":true},\"21\":{\"constant\":\"21\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABmUlEQVRYhe2WPW6DQBCFRymosChItyXutqTDB7AEB0CyD0BnH8BScoBI9gFcUrqkdOkypcscZlJEsxrWy8/COJWLJ5gFzLdvZvBA01yxri94Op5Hq8hL3G4qEcEL4AUwBuB2+25pu6lwvzuIaBCgri94v/+0tN8d8PPjS0SjAOyH/jUFBLDK1hiEgFqnqHWKRV7iKltjkZfmfIq8AZRKUKnk4YcIbKy8AZRKMIriFoDvS7nINS8ALgLgDvhATQLQOjUALjt5zNddaZoEUOSlgXDltA9AxIGuaredGNIsABdEV4UPARR56Q+w3VS9Dox1YrIDfQBdnfAUAFcnuOKuGpmVgr5Pr6s1uxyYDdDXimMK8ikO+HSAGID9mR4S/ycVAQhCwCAEBIBWhXOrtU4R4O8eMQDKMwHwHdJaFMVGtCYKQCngu+UtarshWgMEUNcXbJqrkR1znY5nWQdo93zOs2P7mjgATUs0MdlHfj2K4ucA8Lw/zAvLRWugEQcAAFPl9jEIAfVyYc7Fu4AAlEowe39zSi8XrZh3wy9WIXhdmTDBSwAAAABJRU5ErkJggg==\",\"solid\":true},\"22\":{\"constant\":\"22\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACDklEQVRYhe1WMW7DMAzklCmABo8aPWr0Zj/AgP0AA/YDvCUPCNA+oED7gD4nY8eOfQw7BFSpC6UUaAovGQgTNi0eyaNIent95y2FHgAeAM7nD95S6PPzi7cUen564S2FQmhYi/d18vxvIXS+zCuPw8THw+luII6HE4/DFMUE4H2dGJVALPPKy7zy8XCKIu+0Xdf2MSCUCMD7Ojrv2j6KBoHvvK/ZuYqJiHd7Yu9rJqIkiK7tk8its72vLxnAH7WRRCrfQmjYuSo+iYidq6LogCQr1rmShWIJ5Gdto53Le9QFlGTBKkOWhAgghIZ3e4qHakc6I1rX2cBSZEmI5BmHKXEsZJTDu7aP0WpdbDRPnKuSgIoAkHilVGubnL2A0Zy4CWCZ1yRKyUrJKeoWWZFTVwCkbzEaK9WWjqUJoUlKqLshArBaSPr7Vqp/o2uCS5Bd2//4yqVfR4OHj8MUiaX1nL0moy5D1/aXm1BfEliCXNrFMeqWPfJA+7gioSC8VwYEgAS6zGsyX8x7QMpgcQCdWnqOxNZdkAWAWUBdvqNu2etzcbpmS1AilZWNnI10l5xbzIA1NP7ahrkhdwXAcq5HKU653OWDV7E+xwJBciuVlhINRBPTcirTEx0XFxIcx7g44JKBq5heyaTHNUGthUTIaG7F6BwXEsyOjk7AYhmQV8U2FBC5rVic5ATtsWP0t2/jX6IkdVxEGwAAAABJRU5ErkJggg==\",\"solid\":true},\"25\":{\"constant\":\"25\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABRElEQVRYhe3WIY/CMBTAccIXqJisY3ISsWT7AEvaD1ACHoIZ7gQkd8mJM5ccyeROLsGQIMDtHAgE4sQkH+ahmtyxLn2wthjE33a/bC+v6+x2P1AUa1h+fT+kzhPwBGAAh8PJWihAVZ2tpQUUxRreXj+thQbEUQKEeK2bpQvgTABnAgjxbgNQ6tcKs/ym7gZQ6kMcJRAE/X/15h8w3ZbojAO64xSm2xLejydY/lbajAM4EzBYbVAPbw3gTNQAQdCHMMvdAZrmwMknaAJ0xym8lHs3ABWCM4EexNaA0XCifAuD1cYt4Lowy1GfwQhAHvA3uZCcAa7vBrmQnAIo9WsLSTcH1gByITkFqBaSbhCtAjBzYBUQR4n2YrIKIMR7PEB3M1oDxFECo+Gk8RyZFQBnAmbpAp1RgPw5Va1nTEYAhHjKPyVMFxt7+bh2ej3fAAAAAElFTkSuQmCC\",\"solid\":true},\"26\":{\"constant\":\"26\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABpElEQVRYhe2WoY7CQBCG9w0qeAzkCd4BHgBy9wAXDHU1TSCpJWETJKgaJKKysoiKiooVFRUVfZBBXOYybHe3u71L1iD+hDb7z//N0G6X8dMVfIq9Ad4Aj0cFPsWEaMGnWLiLIdzFcNgfvYiFuxhWyzWslmsIgpm1DvvjJJ+cNwBYnC9W4qfrJN8owDbLRxXlxQAA70d5YfRaAfBaQFJWv+K1AF4LSJsW0qaFrOuVALhOJaxlBTAWPhWA18INgBag4bYAadO+dO8EoOs86/qfwiMA6KPTtP4LTJ1jVyYADJefJWcAXXhSVloAU7gTAB09LWoCwHV09BQkygs7ADlcfpWSshrshNssh6zrX9bgvkB/OwGYxqkC0IU7A9BXSB4hFlUB4Ohx15N9Tjuh3DUWMAHQdSqvFcDmdteG08IywOZ214Y7A6jCMQDvqQBMo58EQMMxAIuqAEydYw0rANm4OF8Gn1UTgCrYGoCGYTgdL16rfNg1nRweRJwAqJGaKYzpJEXX0+vRZ8DlcPofvgHA1+c34CnZRn/1BcEMGF74EpvPP8CnnpwcG+aA5+p5AAAAAElFTkSuQmCC\",\"solid\":true},\"27\":{\"constant\":\"27\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABRklEQVRYhe3WoW6DQBzH8aYvcAKJWyWyggQegAQeANL6NjXUIdZkSyZmlowEySQJpgmidcxRUVFRgezD/KYuYT0gt8HdmYqvvPAhf/LnJvHnF1SUZXscj9+YPAAPwOl0gai4AHV9g6i4ANtwh224w+vLx+hl2Z4P4Lk+PNcHIdoo2Zbzf4CZpH9K12dMgwGbQ8nV0/M7DGP+K9tyoOuzYYD4Wvf2dr5gcygxXYVqAPG1RpAX8FxfHcBMUubhhjGH5/pyRtA1fymAqKw65y8cQD/A+/nTh0sBBHnR+vbLxVo8ICormEkK23KYpADoAqJnmkkDTFchs/ulAOj8mx8g3f3SAPcLSCogKqveBSQc0PcDkgII8gK25agFEKKpA5hJKh7QdYC2XKyZMYwGoDdknpq7YBCgbaXyRC+ggwFttxqeCNFGAfwAn73sX16vWv0AAAAASUVORK5CYII=\",\"solid\":true},\"28\":{\"constant\":\"28\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB3ElEQVRYhbXXvW7CMBAA4Civkc2MHhkitQ9QqX2AonZPxZKRwQNIDF6QEiljMkZiQWKALd1YGBgYeKDrdNFxdX5sw3ALBPnL+Q6fgzyrYLXc3EWeVfD99QNSTuH15a0NKaeQZxXkWQVBEEAUTdpnPt4/24iiCayWG6jrXfs8j7rewfH4CwFfnEYfggMQIZS2A+AH9O3HILoAcVH6AYYyIeX0HwC/C5MUZtu9GwARXRhE9AGE0vYAWlg8TAhc1ASIi9IewKt7LIIDwiSF+aFxAwwhTIXJAUJpP4AtggPiooRFc3KrARcEBWD6nQC8z/GNbACYfieAqcWknEIUTXoRFIDpX58vbgDeYn0I/K9AQJiksGhO/gAToqsmaAbo/nsDhg4gGg8DdPX5EAIBQul28fx68z8LxiKeDhg7D9AO8AYMIWh3mABeNTAGYTqOEZBfb48BdM0EvEVNgEVzsp+IfOcBugXzQ2M/E7ocxRywPl/ac8B6KvadByggLkp3gOs8gABMP27TU+aBLgBNvzXANA8MHcUmAKbfGpBn1eh5gLYoBwil3QGI4PNA11HMAbPtvr0ZWQPolQx/PFQTFCCUhrgoHwOg2zF2HhBKg1D67obsfTu2mQfCJPW6nv8BhZplTEu1ZVAAAAAASUVORK5CYII=\",\"solid\":true},\"29\":{\"constant\":\"29\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB4UlEQVRYhb3XoY6DQBAAUNLfWAcSWUECH0DSfkAvrW9TU1mBgKQCQ3JNkJwkOdPkROs4V1NRUdEPmlO7GZYBdvauJ0Yu+7KzszM4l8s31PUJju8fZNT1CbK0ACE8mM8WKqIwBt+fghAeOI7TWpOlBayWG/D9KURhrML3p53vOxyAm+Rq8yEAB8ECBGVlBMjSwhjBArx9fsFkvVMfGTsBjMCby3VWADfJjQBycwmRJ4FDCI8PCMrKGEAhhPDU2iiM+YDtuYHJemcMwOnAJyFTYgVwk7wDoEqMOgUdwQbsmysEZdUB9NW5jpAhEVYAnAYMGELoAHkS1gCZBh3AQWRpwQccbvdWGvAdoOr8ZYB9c4XJeqcAeonJGENYA+Q9wGWIEUPpeBmAqvOx6mADjo+nQrhJTj5EHMRLABzErwBBWSkArm+9Af3ZPCDvgAlAf/H6StQKcHw8ewFUDJUoeyLaN1c2QEfgdLBnwu25GUzBGEK/EyzAfLZQ/eBwu7cAfU/tGIINkGnQAZwGZD0PrJabVhow4F/mgdVy00qDDojCmOyCQwgrgEwDdQJ9rbgvHVYAN8k7AJNWTEGsAFEYqxGdmgdMuuCvAUFZdZoRtxWzAfjP2E1yshu+dB7Qf8+pgYSL+AHtqWiL99YWkAAAAABJRU5ErkJggg==\",\"solid\":true},\"30\":{\"constant\":\"30\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABx0lEQVRYhe2Wv27CMBDGz4kgSP2TgdFjRo/ZwgMgEXUOSh4gWzIxRYIHQGol1o5IjPQhGKtOjFWf5TpUZzmOQxODlIXhkyDcd/5xZ58Db6/vOKTgDnAHOJ0+cUjB+fyNQwo26y0OKfD9KQ4pECLEWTTHWTTHLM3/VbxIZDznAV7rlwBZmmNZVJ2UpXkDwNYvAbqa2wBs/cMDJI6DiePgbjTG3WiMH5NJqyiGPBFjeK1fAlwy6lq5bgPA1m8E+Hp4NKorQB8/0AfdfMt5vxuNaxCdADbrLZZFhbNojkKEUpwHnc+7ECFmaY4r120HiBirARCECrD3PPx5epYAnAcIAHI3Z2mOAIAAgL4/Rc4DI4DaAlq39RiqAJTcBECVoekGAA2AeJE08v87BxoAL5MGgNqaPgDGQaT3UAWwFQGY8ksAvSx6NWLGMF4kvUVT8lLusqjqAMvDEZeHoxGA88B4n9NC1Br1uwpgyl0W1d/7APVMFbUgZqyhvedJmX4nCRHiZr1trVDtfUAPUJ/pvaUNRv9S3YR6nEnGTagvRIEUrMp0G9r6rQHUClzjByphl/GqSm+BrR/6Gm8tCdD3nJsuHxs/2AyZW+oXuyxtaFNlVdIAAAAASUVORK5CYII=\",\"solid\":true}},\"mapArray\":[[\"2\",\"6\",\"7\",\"13\",\"8\",\"7\",\"6\",\"17\",\"18\",\"19\",\"30\",\"2\",\"13\",\"8\",\"13\",\"13\",\"8\",\"13\",\"13\",\"7\",\"6\",\"30\",\"17\",\"18\",\"20\"],[\"3\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"9\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"10\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"10\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"9\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\"],[\"2\",\"13\",\"14\",\"13\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"9\",\"1\",\"1\",\"11\",\"22\",\"22\",\"22\",\"22\",\"22\",\"13\",\"14\",\"8\"],[\"3\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"9\",\"1\",\"25\",\"26\",\"7\",\"26\",\"6\",\"27\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"11\",\"7\",\"2\",\"13\",\"13\",\"13\",\"13\",\"5\",\"1\",\"9\",\"1\",\"29\",\"1\",\"1\",\"1\",\"1\",\"28\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"4\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\",\"1\",\"29\",\"1\",\"1\",\"1\",\"1\",\"28\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\",\"1\",\"29\",\"1\",\"1\",\"1\",\"1\",\"28\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"2\",\"17\",\"18\",\"18\",\"20\",\"1\",\"13\",\"7\",\"14\",\"22\",\"22\",\"13\",\"13\",\"13\",\"13\",\"8\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\"],[\"2\",\"13\",\"13\",\"13\",\"6\",\"6\",\"5\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"9\",\"13\",\"13\",\"13\",\"13\",\"13\",\"13\",\"8\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"9\"],[\"2\",\"14\",\"13\",\"13\",\"8\",\"13\",\"17\",\"18\",\"18\",\"18\",\"19\",\"14\",\"13\",\"8\",\"1\",\"21\",\"22\",\"22\",\"22\",\"22\",\"8\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"9\",\"13\",\"13\",\"13\",\"8\"],[\"3\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"10\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\",\"1\",\"13\",\"13\",\"13\",\"13\",\"14\",\"13\",\"1\",\"1\",\"1\",\"9\"],[\"3\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"9\"],[\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\",\"12\"]]}";
	mapDef = JSON.parse(mapDef);
	this._parseMapObject(mapDef);

	// strely
	this.shots = [];

	// indikator pohybu
	this.move = false;

	this.timekeeper = JAK.Timekeeper.getInstance();
	this.cUtil = new cUtil(this.canvasMap);

	this.dom.root = JAK.gel(rootElm);

	this.center = {
		x : 40,
		y : 40
	};

	this._makeMap();
	this.addListener('map-loaded', this._mapLoaded.bind(this), this.map);
};

/**
* Parsing object from mapmaker
*/
BattleMage.Dungeon.prototype._parseMapObject = function(obj){
	// set tail size in px
	this.opt.pointSize.w = parseInt(obj.mapSize.w, 10);
	this.opt.pointSize.h = parseInt(obj.mapSize.h, 10);
	// set map array
	this.optmap = obj.mapArray;
	// set style constants
	for(var p in obj.style){
		var style = obj.style[p];
		RPG.STYLE[style.constant] = {
			img : style.imgData,
			color : style.color,
			solid : style.solid,
			width : this.opt.pointSize.w,
			height : this.opt.pointSize.h
		}
	}
};

BattleMage.Dungeon.prototype.$destructor = function(){
	JAK.Events.removeListeners(this.ec);
};

BattleMage.Dungeon.prototype._makeMap = function(){
	var map = this.optmap;
	//this.map = new RPGMAP({
	//this.map = new RPGMAP.ShadowLighting({
	this.map = new RPGMAP.ImageMap({
		pointSize : this.opt.pointSize,
		mapElm : this.dom.root,
		allMap : this.opt.allMap,
		visibility : this.opt.visibility,
		radius : this.opt.radius,
		canvas : true
	}, map);
	this.map.setMidPoint(this.center);
	this.map.build();
};

BattleMage.Dungeon.prototype._mapLoaded = function(){
	this._makeEffectCanvas();
	this._makePlayer();
	this._makeNPCs();
	this._setTicker();
};

BattleMage.Dungeon.prototype._makeNPCs = function(){
	this.npcs = [];
	this.npcs.push(
		new BattleMage.NPC(this, {
			startPos : { x : 2, y : 2 },
			canvas : this.dom.canvasPlace
		}),
		new BattleMage.NPC(this, {
			startPos : { x : 10, y : 5 },
			canvas : this.dom.canvasPlace
		}),
		new BattleMage.NPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.NPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.NPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.NPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.NPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.NPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.NPC(this, { canvas : this.dom.canvasPlace })
	);
};

BattleMage.Dungeon.prototype._makeEffectCanvas = function(){
	this.dom.canvasMap = this.map.getDomCanvas();
	this.canvasPos = JAK.DOM.getBoxPosition(this.map.getDomCanvas());
	this.canvasSize = { width : this.map.getDomCanvas().width, height : this.map.getDomCanvas().height };
	this.dom.canvasPlace = JAK.mel('canvas', { width : this.canvasSize.width, height : this.canvasSize.height }, {
		position : 'absolute',
		top : this.canvasPos.top+'px',
		left : this.canvasPos.left+'px'
	});
	this.canvasPlace = this.dom.canvasPlace.getContext('2d');
	this.dom.canvasMap.parentNode.appendChild(this.dom.canvasPlace);
};

BattleMage.Dungeon.prototype._clearCanvasPlace = function(){
	this.canvasPlace.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
};

BattleMage.Dungeon.prototype._makePlayer = function(){
	this.player = new BattleMage.Player(this, this.dom.canvasPlace);
	this.player.setCenter(this.center);
};

BattleMage.Dungeon.prototype.getMapInstance = function(){
	return this.map;
};

BattleMage.Dungeon.prototype._setTicker = function(){
	this.timekeeper.addListener(this, '_tick', 1);
};

BattleMage.Dungeon.prototype._npcsUpdate = function(){
	var deaths = [];
	for(var i=0;i<this.npcs.length;i++){
		var n = this.npcs[i];
		if(!!n.death){
			deaths.push(i);
		} else {
			n.update();
		}
	}

	for(var i=0;i<deaths.length;i++){
		this.npcs.splice(deaths[i], 1);
	}
};

BattleMage.Dungeon.prototype._npcsDraw = function(){
	for(var i=0;i<this.npcs.length;i++){
		var n = this.npcs[i];
		n.draw();
	}
};

BattleMage.Dungeon.prototype._update = function(){
	// map
	this.map.setMidPoint(this.center);
	this.map.update();
	// player
	this.player.update();
	this._npcsUpdate();
};

BattleMage.Dungeon.prototype._draw = function(){
	// map
	this.map.setMidPoint(this.center);
	this.map.update();

	// player
	this._clearCanvasPlace();
	this.player.draw();
	this._npcsDraw();
};

BattleMage.Dungeon.prototype._tick = function(){
	this._update();
	this._draw();
	this.Stats.update();	
}
