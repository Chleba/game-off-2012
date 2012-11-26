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
		step : 55,
		pointSize : { w : 30, h : 30 }
	}
	this.direction = RPG.E;
	this.HP = RPG.HP;
	this.dom = {};
	this.ec = [];

	this.sounds = new BattleMage.Audio();

	var mapDef = "{\"mapSize\":{\"x\":\"35\",\"y\":\"35\",\"w\":\"32\",\"h\":\"32\"},\"style\":{\"1\":{\"constant\":\"1\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABWElEQVRYhdWXsRHDMAhF2cNlSpUuPUCG8AAZIwOk0AAellTOEcQXIJ1zl4LGZ/AL8PUVqvXg5/P1FbUevO8PLmXlbbt/opSVaz2+4nxfP4vmk/64jGgRK6L5JBPOXzMLIet4+Q2A14lSVi5l5WW5pSDkx2U+oSQEISMCoXdK51OvnRbEstyaQhkImb9tdyZvpj2I7E5Y6qJMkdHFlF3QEJTd7lkInU8jEhuBQIcd6SLeYs0cVpa6aERio+cEBEASQ0V0MUtiqJMQwILoGRCaaUSiECAzUy0tpHNvsU0vmLHiLETjBRkI1IUMBATIQmg7j0KQJspKDAFE8xuAHgSSaO8u4bmo2QEEgYp4AD0XHb4P6JlGIfROuPeBjDpGIC6/D3gQ/3UfiMw066LmfeAKK0bjIHliXW3FFsjnHBj1cwsiM06yivzKihuATJFZFzzD/Hf8Kyuu9eA3lPYjgLgxCxoAAAAASUVORK5CYII=\",\"solid\":false},\"2\":{\"constant\":\"2\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAwklEQVRYhWPYvHn3/8WLV//v7589IJhh1AGjDiDGAYcPn6YZJsoBly/fphkm6IDFi1f/r6/vphkm2gHW1u7/+fmFqY5JcoC0tDJVMUkOkJZW/m9t7f5fW9uYalhaWnngHAAL0aHlAG/v8IF3ALVCYeg6gFqOINsB0dHpg8MB1MBkOwAWFZRiihxAjbqBYgdISytTlA4G1AEUpwFKc8KoA0YdQDUHWFu7k1UIUT0E6F4UwxyA3MAkpQSEYao4AN1QUjAAiNGrtf1wPVYAAAAASUVORK5CYII=\",\"solid\":true},\"3\":{\"constant\":\"3\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABJklEQVRYhe3WsRWEIAwGYPagpKS0ZAALBriCARyDASwcwJLS0vKGy1XxcVxQuZdQ3Lsipfq94E+i9v0JKW2wLCtZKW0Q4wxaG/D+ASFM4P0DnBvB2gG0NqCUensmxhlCmMDaAZwbj7J2+Hi/kgC0IEQAMc63EaIdyBH5x/E5UQB+HCHYiby0NrIACqG1OQDOjfKA/DjyTuCRsAGoiFFdKBFsgFrOSwQWIlgBZ4gSgJ1gB7QgYpx5/wEq590AZcSwrhCsMcwRZ8chBqByfpUOkYuoBSF2E3bfB/J8lwOoyz5QAsobrxZRdgBVZxHtAigR+XF0A9TWM9YUfIMQ3weuEL+3D1BT8AzB3oHaKK4dBxvgziimICL7wJ0pKLYPtIzi/z6wLCu8ANQbGYgMDT9tAAAAAElFTkSuQmCC\",\"solid\":true},\"4\":{\"constant\":\"4\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB7klEQVRYhbXXLbLCQAwA4NygArmyciUC0QNUVCIQKxAIJEfYA1T0AMiKJ5DIJzkKB+AAiCDephN29i8LT8QwQL7JNpsUbgD4SMQNAEcAVKrFMwAac8Rh2GHX9aj1GpVqEQBwms5LWDuiMUfUeo1d1y+h9frte9N0RngA4NPso4EOQYARIAuQIICSxOJp9nj3ABYgW4FSRDXgBJCtAEfw5PS7jwEH93kIQMkJQpXgoVRbDti4pNYDbAGigBBCqXYBdF0vA/QuTh6gTwD4cfBK0JGIAE2zWiAHDxBqsVAVfIQYwBFbBoj1uY+gIEQVoGlWqAFQs6NJXTYhAFWiGsCrsWEACcLaEeHHJUklP7kkuXKG+vzrAH7BpFqMIof4SgVCiNRxfAwItVasz3PdUQ3wL5haRDEgdNnEqiBBFLdh7LIJPQv+APrKPrB1FfBbLAYobdEqQA4RuidiLSoCxP4kB/AR/DhEgFSflyL8Z0IEyO14NQgRgHYASZ/nEOKd0LpLyT+Kf98HCEC7IS2kTbN6Q4SmYApRBSAEbUP8koqN4ug4lgIODMAX1ZJRHJyGd/h79UoFAfg2TBCqQuko9hFwvf7iPF+iX5znC1o7olLtW/l9QM0oFgOGYYfGHBcIJeejWrwP1ADo7Zgg/q4gQbwAwfxi51vI9HMAAAAASUVORK5CYII=\",\"solid\":false},\"5\":{\"constant\":\"5\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABhUlEQVRYhb2Wr5nDMAzFtUFAoWGgYaAHMPAAARmgY3iAgA5QWHhjFB4svGF0SPlUnf/IrnPgoXxxfpH89AS32x1Lejy+MMYdjZkxhBW37YohrOicR2sXNGZGAHh7J8Ydt+2K1i7onD9k7fLnfDgDoAXiFIAYdzXEqRXgEPzj9N6pAPRxAqFKcBkzIzyf31hTL0AKwpj5AHDOI7xeP1jTJwC8HbwS1BIgwppqACmLpaogIWCaLqhVCSDncwlBIggwZkatagAlCAlAlQB5M0vSALRAxLi3ATjnMYQ1ewdSPv83AGkxUg2iCYDakLMhhyi14yMAqkJuDmhT8MiC0QCtEM0A1IbaJFTvA6MAuL9lABX3Af5QKw2AnHg5iwLd6hbxv5EAKZUs2pQFXHSgBkBC8B/ougNcWoDcejYMIDdqaxDDAHI+r0EMA+jeB0YCOOeTKViCGF4B6fOhcVwC0ERxMg17BhEfSKl9QJOCB0DPKE5Nwp4ofmtB70ScpsuYfSB3sFa9+8AvW/7WqON+c0gAAAAASUVORK5CYII=\",\"solid\":true},\"6\":{\"constant\":\"6\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABhElEQVRYhe2WsRHCMAxFtRcDUDAARQag9AApPECKDECZkjEoKSkZxhScOOXnS3ZIkYZCl0ssSy/fkhIZx2vZ0+QP8Ae43x9lT5Pn81X2NMl5KHuanE7nssUOh+Om/dJ1l7LGWoJa/5T6MJ7UHFqAovWU+hkE5vsC/ArSCuDFF+uY8+AG6bpLyXlYBIoANLHG1f02xkwBBqDP9Yo+rQA2+QKAOUWBagA2EcZGELEOGhyLhgGoD6t69Gem+xcK4Dl7b4IqWbAIAutioYCX3FPAAtSSsxyim3ExCrYFANdmClhpokLyAGzXYFIGkFL/+Rhhq9XkZ0XIktk9bhcwmdYowABafkR0TxXAO0dUgw2snAea3KpA2xCnYHSm6GfV8JLbGK4CEQBTi7VYy0fKVaB1ojEAr1PcUYwLUQ14xeT1O3sZCmDNkx/Pchyv1YHDuqkK4AVlRVUr1FUAbCghAF5bAFirzgaRN3DsvW0he89qAHs9VIAlY0AIwPpebZpuZZpu4STU+G9/IOJsaTTbFQAAAABJRU5ErkJggg==\",\"solid\":true},\"7\":{\"constant\":\"7\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABIUlEQVRYhe3XqxHDMAwGYO9hGGhomAEKPECBB8gYGSBAAxgaBgZ2OBU5p/r8ak9KQQtEernLl1TyryiAgOu6vRRAQO8XNMbiPN/OMsYiQECAgEop1Ho6r3Hujt4v6NwdtZ5wXTeMcT+vzyvGHY/jgSq/Oa0Wgg2QfqBPP4IQA/TehDFWBpAQNUxCsANoY+VVQqSbsgHy7h5FsAJ6iFJjsgPeRbD2wCcINkA+56nLLwOURswYi1pPTQT7UUxHrIVIZ4VIFuSIWk+IvIGRAKIlmgUjCLEsGEWIAy7fB0YQdDrEAC2ESBzX5rwVxb+1D9Sm478PfGUfEAGU9oFeFLMCAMLwPkBHlP0cKO0DtSgWiWOK6PWEGID+HZftA71vQel94Aml0xZEAeqPvwAAAABJRU5ErkJggg==\",\"solid\":true},\"8\":{\"constant\":\"8\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB7klEQVRYha3XIbKDQAwG4P8GiEpk5UoEogdAIBEVKyoqkD0CB0BwACTiicrKJzlKD/AOUJFnSCeku8AuFZnpdOjkA5JNiq7rqWnaWXRdT9bWZExGp1PxDmMy6rqeuq4nAJSmx/c1ZXkma2vqp+9bgEaA/hZiBAg6uYwlhAvQAm/ACBAB9LIXb/wBBL4jefdbEBrQADPAc0pOE8QVL3v5BKw9CWOyD8AN2A9ghA/DCA24AvsAsrB0uBB81wCoAmaAZvqcA9sBurq3IgoFuAFUTBEMWEO4ClMCriJxkhziAKEIBlQqeTBg6bBZQnBSMwUnDwboPucqXwPk6q6jAa4WMyajND0GFaY8J/KpKJcQL3uhH4ijWLbYEsJ1VvDs4N9HAVwIX024DiqJiAasDSAXQn9vbR0G8PX5VoSrRqIAMQjfUyi+AQhFSEwR0oahLaa7wwWo9gCWEL4W1dfvAvh2Atc5wa9jFyB2H9A1EQ2IGcW+wowGfAvBu0EUYA+Cj98GkTvhVoSuiSQ5zBbTPAbg2ge2jGLe/yqRPArAA2TLPiBbVC6gDLjGAvQ8133uewKVSCy3YwaMK/GEGMcSsWUKaoB8DWl6pKZpaRju3lc5DHd6PH7nAPk61hC5qAFObG1NZXmOA4ROwVwkln/PQwH/nN1ob96G2wAAAAAASUVORK5CYII=\",\"solid\":false},\"9\":{\"constant\":\"9\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABgUlEQVRYhb3XoZXDMAwGYG0QUGgYaBjYAQ54gAAP0DEyQIEHCCzsGIUHC28YHXLOcWRJjt0D/3sFfckXx5IVCGHFZbnvEsKK3t/Q2gmv168t1k4YwoohrAgAaMy4/ce5Gb2/oXMzGjPistzx8Xhu/y8F8pun4RDdAPFH+vQaxMcA0kpYO30GEBElTER0B6QbKw+FiDfVAF6vbzGQ724tQgN4v3/EAFViEsT7mwqgCZTqXEJwgGG4qANcs+EQ0gpoA3mdx13eAkirRQpQJWbthMaMLIICODfvHkINyEuMQ8Re0R1AIUp7gluBmpsfANIBtOtgBKD26a2d6LNAg+gOqEVQgNqbs4Az80AzQEKk1VF6BbU5ADjETp4B0kqoCbkC0lGcA4wZq/r/4SxonQdaIs4DperoCmidB7oAWuaBJgDXbP4FQM0D0lHcFRDCqp4H0hLtCogI6oLSCpxtQFsjyj9I40W5PUHNA2ezA6SvQzMPnO1+w3D5ewW1X8UpQBsO8Asz29NkBrEy6gAAAABJRU5ErkJggg==\",\"solid\":true},\"10\":{\"constant\":\"10\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAwklEQVRYhe3WIRLDIBCFYW4QUYmMjKzcAyA4QEQO0GPkABU5QCQyMrIysjKyh9kqZnBdyGOYDohf82Wy7KCWZeUSObfxvr9YNUADHMebcyUCnOeHc+Xc9hswz0/OlQjQdTdGp3UvB2jdc46iAMNwh0Vk4gFEBgawdqwYQGQqB1g7lgMQGZ6mxx8DECUD/L+7WjLgys4Ppz8ZgLp+xYawXgBsBhogBeBfPjBAzMLxrx4oQFr49TCAdBuGByulsIDYUIAvsIOp1yBWWjkAAAAASUVORK5CYII=\",\"solid\":true},\"11\":{\"constant\":\"11\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAfklEQVRYhe3VoQ2AMBCF4bdBBfJkZSWyA1R0AMbpAAgGYJxKZCXDPBQKScJLyInff+ldrti2ncrgAAf0flAZxjipDK2tVIYQJiqDWaQypDRTmQMc4AA9IOdCZah1oTL9X/BmfmaRORfdEjrAAf8AyA+R/BTfT/H1BXzsgApwAZzbbUbVa46uAAAAAElFTkSuQmCC\",\"solid\":true},\"12\":{\"constant\":\"12\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABxklEQVRYhe2WvXHDMAyF3x4qU7JUkcKNOw/gUkUKFy45ggZgoQE8QBbwBhzFA2SAFEgjKDAEUJSiFLlL8e50JxH8RPw84gMgWqn3gtbEeQCELQB76R/g7wJ8dm+uVgPkhYCWSl2wJk4GCAmgPNLUKhZUGyMDlADCBSDWSTy//oIuhpBGkjT+QVoR8OTobCiKfaSQxtw98D3JIkDDcDPV9+lJXXelEFo6HE6TQmhn66z0zABkjpvmZRNECC2F0M7WR1WsiwBWEN5cQwzDjbruSk3zMgGwNEBaAsgCwDtOfQIWhE5HNH70CYDbiJ+Xcio3lvJqQqYgSgB+gfuRcD9OH9QUlgXgQcgUmAD6BGqq2zsFCyKK9JoAnBcGqG0xqxZkTfB6BuCpm60TOCuAmhbzAPR6eQJnDyAaADKIVAnCmhN6n1UAHMTr8yWAvk/LAJwf/sibeF6f1wBkpWINeIVWKswaADanCcAbRKXpV2tAcp3bhkm98AB+AiFHsQsg72o1AB6E56JR7TMD0CaxpxVLANOMsnqZYN8HtlrxKgCuTivIVivWALkGYE8rlgAzL5AA2QDYw4qlF8wGEc8BKU7BXlYs7wN6ny/p/+48ESt6qQAAAABJRU5ErkJggg==\",\"solid\":false},\"13\":{\"constant\":\"13\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABs0lEQVRYhe2WLZLDMAyFHysoMAg0DAws9AECcoACHyDQBwjIAQp6gB6ncGHhHkZLVp4Xx/mZJp2QgjcdV7b0WbIV435/yJHCF+AL8Hz+yJHC6/UrRwp9f5MjBe9bOVIwphDW6YzNY/5vaT54Ubo4VdNco9I1OR85n+k8GFNIVV3EuTqmxblaquoyCMhjncf2dzUA4GBVdRkBOVeLc3U8QGrbolUZ0LGmTWEVRJ0tlSWnbAY0YArEC60t4/wtIDCmEGvLUWo45c7VYm05qSmQ1SVgZ1r/Ja0BWdWI3g08BcEgq25BCjCX6k9oADA3URtJWq7NAOqU05zWUZtO2hnXlm1OMKaQEDoJoRPvWzGmkL6/SQhdnBRCJ31/GwX3vo3r+Jf9LdnBO9F+730rAEZtWAH32n3MAIvvvRI3zTWebj4PORD2Aww/RADiGh1nAfRMaOoV4nTGIEgqDaB+GNDachogd7K1NXvfDiDYrh0zd5XVlrPzJkcAAATALMSufSCm4j+o1m0KgkF2ew+kAForAIOPEkPs9ihNAXKl4Jp/5FGaA2CInI2hNr+IOO1T1yu903vpD/txpl8ar4E0AAAAAElFTkSuQmCC\",\"solid\":true},\"15\":{\"constant\":\"15\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA90lEQVRYhe2WIRKDMBBFv0MgViAjkZFIDoDgAAgOUMkBKjhABQfocZCVyB5mKxhooA0lnWm/Qbxhlv0JnwR2g667KhMcBg4DfX9TJhiGuzJB216UCer6pEwgkmgUQ0WSma04RLtnLKIYLwkf32jf6d0cyrJSJsjzQpnAXQ4GfAP0LaAXIvpfYEyqTGgGrM1GA9Zm+m+MSbUsK7U2G5tR05x1fZ1w4xCtb+w6pqyAC4Bnw8jzQo1J56Yx7dW8XwFakWQR+3ILAyKJAlhM6sYh2ukhUYzNHFxn7tc5VSrfW3zSuve2cvw6QK+E9F5AP5TS2/GeA+YveQAHjsfOeyqnDQAAAABJRU5ErkJggg==\",\"solid\":true},\"17\":{\"constant\":\"17\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABoklEQVRYhe2WLXLDMBCFlwUEGAQGFhoG7gEEdACDPYCgD2CQAwTkAD1OYGFgD7MFnaeuZVuWPW1FAt5k7Gh3P+2zfuh+f9eaohfAC+Dx+NCaoufzU2uKrteb1hSJBK0pOhxJm+YUtef5fH7LKhdPhyNpKjvAqm0vyuzU+24kkaB9P6j3XSzqfad9P6hIUO+7WDwVpclKxOyiUBQF4a0F8r6LnUJhgJJNVqq2vcRkdtZLsgCIiwBzbdmiUgv+FKDUgrSTRRbkWrvFgrlczG59IxIJiyBo5ZoFzC6OTSe2ugoAMgdhvcxZAACsGjspyrUOtEi8ZkkuDyDRVUBkAWwCzMq2EMtxC4iFYHZKbXvREgECwd53RXGpJgB9PyiEjwm/aTDe5z7aXD6AZztgl6BI2DXLTR0YnUz0cxgBAP/Bc/iOwyntEGKY3Sgf8hcDWAiR8L1kiCanI8Zbe5DcQiJ+1gJ8pXYwnq0dOaVnAg6tNN8EYMsSWtuysXmtbcsjgD33gSXZIksSCWOAGhdRFGd2dS6lKN40p303ot9QXHlLF9D/0hdAVOzKTP7HmwAAAABJRU5ErkJggg==\",\"solid\":true},\"19\":{\"constant\":\"19\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB0ElEQVRYhb3XoZqDMAwAYN6jYgKJrOwDVPAAE8gTyIlJRCUCMYGYQCJOTJxAIicmJib2QDnVfqEEaLrjRGTp/zVNE5JhGKHvb3C5dGT0/Q2MaUCIFPL86EIpDVkmQYgUkiSZrDGmgaIoIcskKKVdZJmcfT/hAGRVu83XABwEC6DbLghgTBOMYAG+vn/gUJ7cR7ZOACPw5nZdFEBWdRDAbm4h9iRwCJHyAbrtggEUQojUrVVK8wHnYYRDeQoG4HTgk7ApiQLIqp4BqBKjTsFHsAFmvINuuxlgqc59hA2LiALgNGDAGsIH2JOIBtg0+AAOwpiGD2gez0ka8B2g6nw3gBnvcChPDuCXmI0tRDTA3gNchhixlo7dAFSdb1UHG3B9vR1CVjX5EHEQuwA4iI8Auu0cANe334D+bB6wdyAE4L94SyUaBbi+3osAKtZKlD0RmfHOBvgInA72THgextUUbCH8O8EC5PnR9YPm8ZwAlp7aLQQbYNPgAzgNKHoeKIpykgYM+Jd5oCjKSRp8gFKa7IJriCiATQN1AkuteCkdUQBZ1TNASCumIFEApbQb0al5IKQLfgzQbTdrRtxWzAbgP2NZ1WQ33HUe8H/PqYGEi/gFZkxxFACWFbUAAAAASUVORK5CYII=\",\"solid\":true},\"21\":{\"constant\":\"21\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABNUlEQVRYhe3WoZKDMBCA4b5BBDKiAolE5gEi9gEikBXIiEoE8kRFBeIEElFRUYFEIioqTiDvYbYqM70SJtsjSU3Fb8M3sLNh0/cDdt0Zj8f2LW0+gA+AAhjHW7BIgGn6DZYT0HVnrOtDsMgAISQylqxO6woBFAIoZCx5DcB5Oks27Uv9G8B5ikJIzLL8T3n1hft+IOcdsC017vsBD9cbfv9MzrwDABTuThfSw1cDANQMkGU5yqaNB1iagyifYAmwLTXWwxgHYEMAKPIgrgYURWl9C7vTJS7gOdm0pM/gBWAOeMwspGiA57vBLKSoAM7T2UJyzUEwgFlIUQG2heQaxKAAyhwEBQghnRdTUABjyfsBrpsxGEAIiUVRLp5jCgIAUKh1Rc4rwPyc2tYzJS8AxhLrnxKlO5XXA2ehnKUOAAAAAElFTkSuQmCC\",\"solid\":true},\"23\":{\"constant\":\"23\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABn0lEQVRYhe2WIbKDMBCGcwNEj1H5DlHBASoqK56MqKzIARCICgQHiKyoQCARCAQCgUAgOMjWdJklCSHhvZmYin+m6eTf/9stpGFpmkNIsS/AF6CqGggp1nUDhBTj/A6c30GIJIgY53eI4zPE8Rmi6OAsIZJdPjVPAzg9cielab7Ltwlwe5WbEmWlAeD3oqysXieArO0gqZtZWdtB1nYg+wFkP0AxTkYA3GcS1nIC2ArfC5C1nR8ALUDDXQFkPyy69wJY67wYJ5D9sAmAPjpN55/A1jl2ZQPAcPVZ8gZYC0/qZhXAFu4FQEdPi9oAcB8dPQURZeUGoIarr1JSN9pJeHuVUIzTcs/nXKCfvQBs4zQBrIV7A9BXSB3h3JEBAEePp57q8zoJtZF/CtgA6D6T1wngKp+r4YuuFICrfK6GewOYwjFgLmoAsI1+FwANxwAsagKwdY41nABU4+mR63/JFgBTsDMADcNwOl5cm3zzdMjk8CLiBUCN1ExhbDcpup+uN58Bn8vpf/g0gMvlF/CW7KK/+qLoAAwXocSOxx8IqTfUHy0nLSdPnAAAAABJRU5ErkJggg==\",\"solid\":true},\"25\":{\"constant\":\"25\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABNklEQVRYhe3WIZKDMBSA4d4gAomoqEQic4CIHACBRCAjKhGRKyoqEBWRCEQFAhkZUYGoQO5h3qrMsA0waSGJqfhlho95zCOH61VAiJrmDn0v4fAFfAFKDeAqK8A4/oKrrACMVcBYBZxfdq9p7nYASjOgNAOEol3CmHwOILV4qzg+GW0GnHtpVVr9QJKk/8KYQByftgFuz3G1y2OAcy/hWLIwgNtzhKLtgNIsHIDUwnh4kqRAaeZnBEvz9wLgUi3O3zlAf4Cv89cP9wIo2m727fO8dA/gUgGpBWBMjLwA9ALSZ6Z5AxxLZux+LwA9/+kHqHe/N8DrAvIK4FKtLiDngLUfkBdA0XaAMQkLQCgKByC1cA9YOqDL89IYw24AfUO2aboLNgHmVqpN+gK6GTB3q7EJoWgXwB8Puvaw+dJgKgAAAABJRU5ErkJggg==\",\"solid\":true},\"27\":{\"constant\":\"27\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABzElEQVRYhbXXIdbCMAwA4N1jYgJZWckBJjjAL5CIyQlkxWTFRMUEonICgUBMTiIQCAQHCip7IX+3ri2IGBiv39KEppkxFpqm/QhjLOz3FQghYbstpxBCgjEWjLGQZRnk+WZ6Zrf7myLPN9A0LfT9ZXqeR99fYBhGyPjiNJYQHIAIqXQYAD+gb78GMQcoO5sG8GVCCPkPgN8VVQ2H8zUOgIg5DCKWAFLpcAAtLB4uBC7qApSdDQfw6l6L4ICiquE4jHEAH8JVmBwglU4DhCI4oOwsNOMtrgZiEBSA6Y8C8D7HNwoBYPqjAK4WE0JCnm8WERSA6W/vjzgAb7ElBP5XIKCoamjGWzrAhZirCZoBuv/JAN8BRONrgLk+9yEQIJWeFj89X+lnwVrEzwFr5wHaAckAH4J2hwuQVANrEK7jGAGn5+s7gLmZgLeoC9CMt/CJKHUeoFtwHMbwmTDmKOaA9v6YzoHgqTh1HqCAsrPxgNh5AAGYftymn8wDcwCa/mCAax7wHcUuAKY/GGCMXT0P0BblAKl0PAARfB6YO4o54HC+TjejYAC9kuGPfTVBAVJpKDv7HQDdjrXzgFQapNIfN+Tk23HIPFBUddL1/A2Sa23Qta1xqQAAAABJRU5ErkJggg==\",\"solid\":true},\"29\":{\"constant\":\"29\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB0UlEQVRYhe2XLZaDMBDH41asqFixAokcGRlTh+AAiBwAmQMgOEAFB6hEVlJXiVyJ7AEQPcSs2DfsJBBCu43Y9yr+r3xMMr8mmQ9EnheodYlal5jnBTbNMZq4L/InXgAvAK1LNKZCYyrUusS+/4om7ov8CWMqrOsD1vUBjalwGK7RxH2RP6FUhqQkSS2DZ4v80BYolf1sATfge/RsAUjr3wPIXwBjKlQqw7d3gbvdx6RH7vkzfs0BCCgI4BM58sm1WQVomuMEkOdFNAHIKSS9ADG1aQVCS/sXbT4DPg3DFcfxhuN4m8U4Tzi+eVYBeJz6NI437LoLtu3Jq6673L8FfAXWEskwXCdHu09hyQVYGr8JYO0UEwA5Fec9ivPegiAAXxQEAZIk9arvvyYAcs4hOMDS+P8BACC94gChLfDNEQSgOs1/SQSw5RAuzeMF4OVxbQW67hJU255W53Gro3ANqHDQPlLxSZL07tQrhF0Z6RxwCQBpJQo+QAh7ML+n6uazVyqbbADkdBDdBki41NyYrvm7pWfcnr93nS8C8EQRCsNnKAgQsx9IknR2PwOI2ZQCyDmA+6EQuymdhaELELsjmgHwTJfnxaaG9FEBSOurCEDiNxJ3KXd5WwlhAAAAAElFTkSuQmCC\",\"solid\":true},\"31\":{\"constant\":\"31\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABY0lEQVRYhe2WLZaEMAzH4xCICiRyJBI5B1jBAUb0AMgeAMEBED0AcuRKJBI5ErmHyYqZ8MJMhwbe7osZ8XuhL6H99yspeN+jJvAR8BEwTTfUBOb5BzWBtu1QE7C2Rk3AmAyTFNCYbGGrvSdW8i8kKbw43nEkNhTPfVBVF9QEzucv1AT4cmigL0B9C9QTkfotyPMTxjhSZCT95vlJJmAYxl0Fxvs+2mdRlHcBzjW4hbU1DsOI1+u3GOcaLIryLXl+wqq6YFGU8XLsfb8IiBUW7/tFAIkPffM2SGZDAtq224wlf2wFOLu2gGaIACs7PyxfAWOy1ZLzb+4DiUqaIQ1AA1pbr2xIQJLC/bDBuiqSD7gyfjopU4UEPMMfmSSA/0821LcoEVHHZLmvbbuXLXKukecBybV6FhCLc66RZ0IAwBh84GEYF6bptliCBPzpozQ289DVFT9KJSXzSJERl2PJA/M/+QU897DsZ6B91AAAAABJRU5ErkJggg==\",\"solid\":true},\"33\":{\"constant\":\"33\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACNUlEQVRYhe1WK5LjMBAVCwgQMDQMDDTUAQx0AAMdwNAHMDA0MAgcMHBAwB4gYGFAQECAQYBBQMAcwNDgDZhqlSRLiTxVuyEDXilpt1pP/VOz3e4drwT7JfBL4Hg845VgfT/glWBN0+GVYELk2G4zDc6T/womRI7D7Y5+HGcE0nSj4f4nrNYs+C0GTIgc/ThimiaLQKyBf0Jgu80gRB6F1Zot0nfhDUGabqy8eITVmi3Sd8GEyPF26XG43SFEbhF4xt5HOPbmmoCUBZQqIUQOKQsdmxgDRJh+myTcm4b2MykL9OOITyMHTA9IWaCqaqt9VlUNKQvLY4/gkrNygAiEkrCqakzTNEPTdNEEqqrWpIl4kADdPiYMJkx98hqF9GEVKFV6QxDqXESODO9277oaOE+gVIk03eiV8wR9P+Dj4w+UKmceY1IW6E5nHG53KFVaXjBDQXKzUbmrD5wnVu64VcPcbKVNdKOQF0xPuHBt+QjTdyZlgf11wOF2t8rQPMj1iq/xuIeH9s4aESUhdULX0LNe8JMmZO73VsGS1rq0dQc94L6GsXiUK1HzQKgTpukGWd0iq1urN7iykH6sTCeh+RpKWSCrW7xdeuyvA7K69cqoE8bq+2RMiBzd6Yz9dfiOCWMQIkdWt2j+HtGdzvown2yJPhEwZd6ZkFZyFeeJvq1PFqsvZTGT6Ynoc5pm88Az0Ej20yrQI5mbA6GBxGeERjLf2++zQa8hnTULgZvZz7B0iHX3fgHABP4RbiQkaAAAAABJRU5ErkJggg==\",\"solid\":true},\"35\":{\"constant\":\"35\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACOElEQVRYhe1WIXLkMBActsDAQNBQUCDAwEAwwEAPMPADDP2AgDzgQB5wzwk8GHiPmQNJa1sj2Zu7VN2SgK5d25Km3dMzY3l5+an3hHwT+Cbw+vpL7wl5e/ut94Q8P//Qe0JSWvQriHH+0n4JYdQQRo1xzr+AiBToe6cioiGMKiKHay+dqMhjtYdj5X18wUhpyQe8H7Ln/wAOS2mpntn1reAxzlcFWuCNjJSW4kC+ZgyDPzwbOPXAMHjte/ch6fWNoA4TGAb/HtB3H8/3vAYEmx44S0EIo24PXYWUFt0euoKAiBRrmACTrVJwiwB8MAy+MqUlABXggSMCnD7hMuJKwHWMc3Fw37vs+sIDvquQPeS7SoFMAMFtmSCvMc6670+6709X45AC2H/phFTaDxWwcYSDAZYAm5JTcVaGXH5cstmslsClkwz2AMtmSfLzzxDgOE0FLAEE4sBQwPoFJpwcUvFY9RFLIISxJgCTtRSwaljDsk9srkEAfeVTHoB8k7vOgtxAGmXYArseCrAnCgJcenzPTr513aoUoEz5RaAmEzg0YXa399WhkA0KrOvWVAD936rJJXuYgsmJTk40+K5IAe4DIDA504hoAFkCeOMijm1ER1VQjlipFEBqOO8IaBtRswxvEbDjGQS4tOwsaOFmH+Bcc6mhCmyJ2gGDKpkcvoLqVvxXjYgdv65bngcAVMDa1hqAK6hqRFwelp2dXLe+bloNqNUHqk7IA8d+btkZ/i84i3H6Tfg/8AfasoEUC9b8DgAAAABJRU5ErkJggg==\",\"solid\":true},\"37\":{\"constant\":\"37\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB+klEQVRYhe2WrXLrMBCFlxcYBBoEBAoaBBgGGOgBDPQAhgIXXGCgBzAwDDA0LDQMNAgIKDDMAxgEFgQYnILOqv5L4970VqTgjGaTsfTN7mp1qKoOcCVjMlBVHVCWz070C2BMBqrrk1uApjmjrk9OpHUKatsLmubsREoloDwvYEzmRFLGICKCU+V5AaUSKJXAmAxap/9VUsYQIoAQATxvBeJUuJDnrUBap/D9jRN53grE99FZExqTIQwjJxIiACmVOCuB729AfZowjCBfasiXGkIEkDLGtrqieX1dHO+ONIj364+4K5/sOSwKwwhSxuDVLzPQ349O3VZXbKvr4nh3JOyOZOP9mrBfv8fdnyd7Dp95EyAMIyiVDGgfjTu5EOCzEoxTfK8koF4JNjMAUsaWVMrY9sDSFN8rCYgAGpaAJ+8E4LtTPinB6RMAF7JzQOt01rH8q9sd75PnxUQTAHYp7JBuOSVjMmupOe6v98SA/CpagLEzUipBnheD343J0DRn5HlhV96wbS8oy+dZ19PfhyHCMHqfhAzQdd1A/CHHbXuxm7TtBVV1mF3H6gOw6voEIYIhwPih8P0NhAhm//uKbu0zAWBvyM6F54LW6cOd3r96PB/sY8QAfPitDx8FGLuhAQBDfMfdXmrHrCPqT62f9IMWgFPBTfHTnvANAoNFWaZjfEgAAAAASUVORK5CYII=\",\"solid\":true},\"39\":{\"constant\":\"39\",\"color\":\"#000\",\"imgData\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABNklEQVRYhe2WLRLCMBBG1yEQEZWRlZXIHKCiB0D0AEgOgOAACA6ArEQikUgkksMs6itLhkKSTalBvMkkk8682b+U9vsDT0HXHfl0OjP9Bf4Cl8uVx6DrjmECt9udx+KTRC+w3e54LIIE2nbFYxAsYEzBszmxMUVPyl6eOVeHC/gffwJ3h8CdKIGmWXJOnKvZ2jJcwLmac1JViziBb2GNxdpyOgFrS26a5bQpiBbINXTQ/9ECOTsgSQBFowHh/4kA2kzukfskgapacCiocnkmiy9JoG1XvF5v2F/B0B6rugZiIuDjt1+SANHzIcEcx+ODHCP8xhSDIlkEjCmYiF4E5B4C8j66QJ0Cv8rl4/LuLFsXaGeAWkDz7iMaKoHU2S/ngXoOpCDrQyWg/fNRC4T8jL6DiLIIPAB2OdrzT8kFqAAAAABJRU5ErkJggg==\",\"solid\":true}},\"mapArray\":[[\"2\",\"13\",\"15\",\"15\",\"31\",\"17\",\"10\",\"37\",\"33\",\"37\",\"35\",\"37\",\"35\",\"35\",\"2\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"10\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"10\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"2\",\"11\",\"11\",\"11\",\"12\",\"11\",\"11\",\"11\",\"11\",\"2\",\"11\",\"23\",\"33\",\"35\",\"37\",\"11\",\"11\",\"10\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"13\",\"15\",\"17\",\"12\",\"35\",\"37\",\"33\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"7\"],[\"2\",\"37\",\"10\",\"11\",\"12\",\"11\",\"10\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"4\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"7\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"8\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"2\",\"11\",\"11\",\"11\",\"12\",\"35\",\"33\",\"37\",\"10\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"7\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"7\",\"1\",\"1\",\"1\",\"9\",\"13\",\"15\",\"29\",\"31\",\"15\",\"17\",\"11\",\"5\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"9\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"10\",\"1\",\"1\",\"21\",\"23\",\"23\",\"23\",\"12\",\"23\",\"23\",\"23\",\"25\",\"1\",\"1\",\"2\",\"35\",\"37\",\"33\",\"12\",\"11\",\"11\",\"11\",\"10\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"19\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"27\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"19\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"27\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"19\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"27\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"19\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"27\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"2\",\"12\",\"35\",\"10\",\"13\",\"15\",\"29\",\"15\",\"15\",\"39\",\"1\",\"1\",\"19\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"27\",\"1\",\"1\",\"2\",\"11\",\"11\",\"11\",\"12\",\"13\",\"31\",\"15\",\"39\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"19\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"27\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"11\",\"11\",\"11\",\"11\",\"12\",\"11\",\"11\",\"11\",\"11\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"13\",\"15\",\"29\",\"15\",\"15\",\"39\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"2\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"11\",\"10\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"13\",\"15\",\"29\",\"15\",\"15\",\"39\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"2\",\"11\",\"11\",\"11\",\"11\",\"12\",\"11\",\"13\",\"15\",\"29\",\"17\",\"10\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"11\",\"11\",\"11\",\"12\",\"11\",\"11\",\"11\",\"10\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"13\",\"15\",\"29\",\"15\",\"15\",\"39\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"8\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"3\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"3\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"1\",\"7\",\"1\",\"1\",\"7\"],[\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\",\"6\"]]}";
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
		//new BattleMage.NPC(this, {
		new BattleMage.shootNPC(this, {
			startPos : { x : 2, y : 2 },
			canvas : this.dom.canvasPlace
		}),
		new BattleMage.shootNPC(this, {
			startPos : { x : 10, y : 5 },
			canvas : this.dom.canvasPlace
		}),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace }),
		new BattleMage.shootNPC(this, { canvas : this.dom.canvasPlace })
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

	if(this.npcs.length == 0){
		this._victory();
		return;
	}

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
};

BattleMage.Dungeon.prototype._victory = function(){
	// stop ticker
	this.timekeeper.removeListener(this);
	// clear canvas
	this.map._clearMap();
	this._clearCanvasPlace();
	// add texts
	this.dom.victoryDiv = JAK.mel('div', { className : 'victoryDiv' }, {
		width : this.canvasSize.width+'px',
		height : this.canvasSize.height+'px'
	});
	this.dom.victoryTitle = JAK.mel('h2', { innerHTML : 'Victory' });
	this.dom.victoryText = JAK.mel('p', {
		className : 'status',
		innerHTML : 'You have defeated all stormtroopers and clear the base from the empire scum. New advertures awaits. To be continued ...'
	});
	this.dom.victoryText.style.color = 'green';
	this.dom.continueText = JAK.mel('p', {
		className : 'info',
		innerHTML : 'To be continued ... Watch the progress on <a href="http://chleba.org/starwars">http://chleba.org/starwars</a>. Map Editor, more spells, unique ememies, story line, randomly generated dungeons and many more will come.'
	});
	this.dom.victoryDiv.appendChild(this.dom.victoryTitle);
	this.dom.victoryDiv.appendChild(this.dom.victoryText);
	this.dom.victoryDiv.appendChild(this.dom.continueText);

	this.dom.root.appendChild(this.dom.victoryDiv);
};

BattleMage.Dungeon.prototype._gameOver = function(){
	// stop ticker
	this.timekeeper.removeListener(this);
	// clear canvas
	this.map._clearMap();
	this._clearCanvasPlace();
	// add texts
	this.dom.loseDiv = JAK.mel('div', { className : 'victoryDiv' }, {
		width : this.canvasSize.width+'px',
		height : this.canvasSize.height+'px'
	});
	this.dom.loseTitle = JAK.mel('h2', { innerHTML : 'Defeat' });
	this.dom.loseText = JAK.mel('p', {
		className : 'status',
		innerHTML : 'You lost'
	});
	this.dom.loseText.style.color = 'red';
	this.dom.continueText = JAK.mel('p', {
		className : 'info',
		innerHTML : 'To be continued ... Watch the progress on <a href="http://chleba.org/starwars">http://chleba.org/starwars</a>. Map Editor, more spells, unique ememies, story line, randomly generated dungeons and many more will come.'
	});
	this.dom.loseDiv.appendChild(this.dom.loseTitle);
	this.dom.loseDiv.appendChild(this.dom.loseText);
	this.dom.loseDiv.appendChild(this.dom.continueText);

	this.dom.root.appendChild(this.dom.loseDiv);
};
