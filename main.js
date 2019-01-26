(function(){
	document.addEventListener("keydown", function(e){
		//e.preventDefault();
		console.log(e.keyCode);
		var k = e.keyCode;
		if(k == 37){
			eventKeyLeft(e);
		}
		else if(k == 38){
			eventKeyUp(e);
		}
		else if(k == 39){
			eventKeyRight(e);
		}
		else if(k == 40){
			eventKeyDown(e);
		}
		
		if(e.ctrlKey && k===82){
			location.reload();
		}
	});
	
    var canvas = document.getElementById("stage");
    var ctx = canvas.getContext("2d");

	console.log(window);

    var width = window.innerWidth;
    var height = window.innerHeight*0.05;
    canvas.width = width;
    canvas.height = height;

	//initialize web audio api
	{
	var context;
	var bufferList = {};
	var sources = {};
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	context = new AudioContext();
	context2 = new AudioContext();
	}

	//audio functions define
	{
	function loadAudioSound(url, name,) {
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.responseType = 'arraybuffer';
		
		// Decode asynchronously
		request.onload = function() {
		  context.decodeAudioData(request.response, function(buffer) {
			bufferList[name] = buffer;
			//make analyzer
			var analyzer = context.createAnalyser();
			//connect analyser
			analyzer.connect(context.destination);
			//make source buffer
			sources[name] = context.createBufferSource();
			sources[name].buffer = buffer;
			//console.log(sources[name]);
			console.log(context);
			sources[name].connect(analyzer);
			sources[name].start(0);
			var startTMP = context.currentTime;
			console.log("loaded "+url+" -->"+name);
			//get audio wave data
			if(name=="test"){
				analyzer.fftSize = 128;
				var bufferLength = analyzer.frequencyBinCount;
				var dataArray = new Uint8Array(bufferLength);
				setInterval(function(){
					var c = document.getElementById("visualiser");
					var ctx = c.getContext("2d");
					c.width = width;
					c.height = 300;
					analyzer.getByteTimeDomainData(dataArray);
					//analyzer.getByteFrequencyData(dataArray);
					for(var i=0; i<bufferLength; i++){
						ctx.beginPath();
						ctx.rect(i/bufferLength*c.width, c.height-dataArray[i], 1, dataArray[i]);
						ctx.stroke();
					}
					//console.log(analyzer);
					//console.log(dataArray);
				}, 50);
			}
			
			if(name=="test"){
				setInterval(function(){
					var c = document.getElementById("visualiser2");
					var ctx = c.getContext("2d");
					c.width = width;
					c.height = 300;
					
					var data = sources[name].buffer.getChannelData(0);
					var increment = Math.floor(data.length/3000);
					if(increment == 0) increment = 1;
					for(var i=0; i<data.length; i+=increment){
						ctx.beginPath();
						ctx.rect(i/data.length*width, c.height/2, 1, +data[i]*100);
						ctx.stroke();
					}
					var data = sources[name].buffer.getChannelData(1);
					for(var i=0; i<data.length; i+=increment){
						ctx.beginPath();
						ctx.rect(i/data.length*width, c.height/2, 1, -data[i]*100);
						ctx.stroke();
					}
					
					var buf = sources[name].buffer;
					var time = context.currentTime - startTMP;
					var per = time/buf.duration;
					ctx.beginPath();
					ctx.lineTo(per*c.width, 0);
					ctx.lineTo(per*c.width, c.height);
					ctx.stroke();
					
					}, 100);
					document.getElementById("visualiser2").addEventListener("click", function(e){
						var x = e.layerX;
						var offset = x/width * sources[name].buffer.duration;
						sources[name].stop();
						playSound("test", 0, offset);
						startTMP = context.currentTime - offset;
					});
				
				}
		  }, onError);
		}
		request.send();
	}

	function onError(){
		console.log("failed! to decodeAudioData");
	}

	function playSound(name, time=0, offset=0, loop=false, loopStart=0, loopEnd=1000) {
		sources[name] = context.createBufferSource();
		sources[name].buffer = bufferList[name];
		sources[name].loop = loop;
		if(loop){
			sources[name].loopStart = loopStart;
			sources[name].loopEnd = loopEnd;
		}
		sources[name].connect(context.destination);
		sources[name].start(time, offset);
		//console.log(sources[name].buffer.duration);
		console.log(name +" is played: (time="+time+") (offset="+offset+")");
		return sources[name];
	}	
	
	function playSoundDuration(name, time=0, offset=0, loop=false, loopStart=0, loopEnd=1000, duration) {
		sources[name] = context.createBufferSource();
		sources[name].buffer = bufferList[name];
		sources[name].loop = loop;
		if(loop){
			sources[name].loopStart = loopStart;
			sources[name].loopEnd = loopEnd;
		}
		sources[name].connect(context.destination);
		sources[name].start(time, offset, duration);
		//console.log(sources[name].buffer.duration);
		console.log(name +" is played: (time="+time+") (offset="+offset+")");
		return sources[name];
	}	
	
	
	function stopSound(name, time=0){
		sources[name].stop(time);
	}
	
	function pauseresumeSound(){
		if(context.state == "suspended"){
			context.resume();
		}
		else{
			context.suspend();
		}
	}
	}
	
	//load audio
	{
		//loadAudioSound("./test.mp3", "test");
		//loadAudioSound("./test.ogg", "test");
		loadAudioSound("./test2.mp3", "test");
		loadAudioSound("./click.wav", "click");
	}
	
	var fl = false;
	$("#btn").on("click", function(){
		console.log(context.state);
		fl = !fl;
		if(fl)
			playSound("test", 0, 10);
		else
			stopSound("test");
		console.log(context.state);
		
	});
	$("#btn2").on("click", function(){
		pauseresumeSound();
	});
	
	
	class BeatCutter{
		constructor(canvasId){
			this.canvas = document.getElementById(canvasId);
			this.context = this.canvas.getContext('2d');
			this.width = width*0.8;
			this.height = height*0.15;
			this.x = 0;
			this.y = 0;
			this.zerox = width/10;
			this.zeroy = height/2;
			this.endx = this.zerox + this.width;
			
			this.bpm = 122.9;
			this.mpb = 1/this.bpm;
			this.spb = this.mpb*60;
			this.offset = 0;
			
			this.beatClicks = [];
			
			$("#bpm").value = this.bpm;
		}
		
		setBpm(bpm = this.bpm){
			this.bpm = bpm;
			this.mpb = 1/this.bpm;
			this.spb = this.mpb*60;
		}
		
		stopAllClicks(){
			for(var b of this.beatClicks){
				b.stop();
			}
		}
		
		playClicks(){
			this.beatClicks = [];
			for(var i=0; i<100; i++){
				var ret = playSound("click", context.currentTime+i*this.spb);
				this.beatClicks.push(ret);
			}
		}
		
		draw(){
			this.context.beginPath();
			this.context.strokeStyle = "red";
			this.context.lineTo(this.zerox, 0);
			this.context.lineTo(this.zerox, height);
			this.context.stroke();
			
			this.context.beginPath();
			this.context.strokeStyle = "red";
			this.context.lineTo(this.zerox+this.width, 0);
			this.context.lineTo(this.zerox+this.width, height);
			this.context.stroke();
            
			this.context.strokeStyle = "black";
			
			// context.beginPath();
			// for(var x=width/10; x<=width/10*9; x+=width/512){
				// context.lineTo(x, height*0.5+height*0.15*Math.sin(x*(2*Math.PI/width*10)));
			// }
			// context.stroke();
			

		}
		
		drawWave(){
			var analyzer = context.createAnalyser();
			sources["test"].connect(analyzer);
			analyzer.connect(context.destination);
			analyzer.fftSize = 2048;
			var bufferLength = analyzer.frequencyBinCount;
			var dataArray = new Float32Array(bufferLength);
			analyzer.getFloatTimeDomainData(dataArray);
			//analyzer.getFloatFrequencyData(dataArray);
			//console.log(analyzer);
			//console.log(dataArray);
			
			
			
			this.context.beginPath();
			for(var i=0; i<bufferLength; i++){
				var v = dataArray[i] / 128.0;
				var y = v*height/2;
				this.context.lineTo(i/bufferLength*width, y);
			}
			this.context.stroke();
		}
		
		drawBeat(){
			var context = this.context;
			var minPerbeat = 1.0/this.bpm;
			var secPerbeat = minPerbeat*60.0;
			var d = sources["test"].buffer.duration;
			for(var i=0; this.zerox+i*secPerbeat*4/d*(width)<this.width;i++){
				context.beginPath();
				context.lineTo(this.zerox+i*secPerbeat*4/d*(width), 0);
				context.lineTo(this.zerox+i*secPerbeat*4/d*(width), height);
				context.stroke();
			}
		}
		
		drawPlayBar(){
			var d = sources["test"].buffer.duration;
			this.context.beginPath();
			this.context.lineTo(this.zerox+playTime/d*this.width, 0);
			this.context.lineTo(this.zerox+playTime/d*this.width, height);
			this.context.stroke();
		}
	}
	
	var bc = new BeatCutter("stage");
	var playing = 0;
	var startTime = 0;
	var stopAt = 0;
	var playedTime = 0;
	var playTime = 0;
	var ini = 1;
	var beatClicks = [];
	$("#btn3").on("click", function(){
			if(!playing){ //play if not playing
				startTime = context.currentTime;
				playSound("test", context.currentTime, stopAt);
				bc.playClicks();
				playing = 1;
			}
			else{ //stop if playing
				playedTime = context.currentTime - startTime;
				stopAt += playedTime;
				stopSound("test");
				stopSound("click");
				bc.stopAllClicks();
				playing = 0;
			}
			
			if(ini){
				ini = 0;
			}
		}
	);
	
	function anime(){
		try{
			sources["test"].buffer;
		}
		catch(e){
			return;
		}
		
		bc.context.clearRect(0, 0, width, height);
		bc.draw();
		bc.drawBeat();
		bc.drawPlayBar();
		
		if(playing)
			playTime = stopAt + (context.currentTime-startTime);
		
		$("#span1").html(context.currentTime);
		$("#span2").html(startTime);
		$("#span3").html(playTime);
		$("#span4").html(stopAt);
		$("#span5").html(bc.offset);
		
		$("#span21").html(bc.bpm);
		$("#span22").html(bc.mpb);
		$("#span23").html(bc.spb);
		$("#span24").html(bc.offset);
		
		
	}

	setTimeout(setInterval(anime, 10), 3000);
	
	
	function eventKeyDown(e){
		if(e.ctrlKey){
			bc.setBpm(bc.bpm-0.1);
		}
		else{
			bc.setBpm(bc.bpm-1);
		}
		bc.stopAllClicks();
		if(playing)bc.playClicks();
	}
	
	function eventKeyUp(e){
		if(e.ctrlKey){
			bc.setBpm(bc.bpm+0.1);
		}
		else{
			bc.setBpm(bc.bpm+1);
		}
		bc.stopAllClicks();
		if(playing)bc.playClicks();
	}
	
	function eventKeyLeft(e){
		bc.offset -= 0.05;
		bc.stopAllClicks();
		if(playing)bc.playClicks();
	}
	
	function eventKeyRight(e){
		bc.offset += 0.05;
		bc.stopAllClicks();
		if(playing)bc.playClicks();
	}
	
	var playingOther = false;
	class playBox{
		constructor(buffer, bufferName, loopStart, loopEnd){
			this.name = "";
			this.when = 0;
			this.offset = loopStart;
			this.duration = 100;
			this.buffer = buffer;
			this.bufferName = bufferName;
			this.loop = true;
			this.id = undefined;
			this.loopStart = loopStart;
			this.loopEnd = loopEnd;
			this.playing = false;
			this.startTime = undefined;
			this.playedTime = undefined;
			this.playTime = undefined;
			this.stopAt = undefined;
		}
		
		creatElement(){
			var elem = $("<div style='position:relative;display:inline-block;margin:20px;width:300px;height:100px;border:1px solid black'></div>")
			elem.html(this.name);
			var wave = $("<div style='width:200px;height:80;;border:1px solid black;margin:0 50px;'></div>")
			var bottomDiv = $("<div class='container' style='position:absolute;bottom:0;text-align:center;'></div>")
			var playBtn = $("<button class='btn btn-outline-dark' style='margin:3px;'>Play</button>")
			var stopBtn = $("<button class='btn btn-outline-dark' style='margin:3px;'>Stop</button>")
			var loopBtn = $("<button class='btn btn-outline-dark' style='margin:3px;'>Loop: ON</button>")
			var loopStart = this.loopStart;
			var loopEnd = this.loopEnd;
			
			var sliderDiv = $("<div style='text-align:center;'></div>")
			var slider = $("<input type='range' style='width:80%;margin-top:15px'></input>");
			slider.attr("min", loopStart);
			slider.attr("max", loopEnd);
			slider.attr("value", loopStart);
			slider.attr("step", (loopEnd - loopStart)/100);
			
			setInterval(()=>{	
				if(this.playing){
					if(this.loop) this.playTime = (this.loopStart + (context.currentTime-this.startTime)%(this.loopEnd-this.loopStart));
					else this.playTime = (this.loopStart + (context.currentTime-this.startTime));
					//console.log("playTime="+this.playTime);
					slider.attr("value", this.playTime);
					sliderDiv.append(slider);
				}
			}, 30);
			
			
			sliderDiv.append(slider);
			
			playBtn.on("click", () => {
				console.log("play:"+this.id);
				if(playingOther){
					stopSound(this.bufferName);
				}
				playingOther = true;
				if(this.loop)
					playSound(this.bufferName, this.when, this.offset, this.loop, this.loopStart, this.loopEnd);
				else {
					playSoundDuration(this.bufferName, this.when, this.offset, this.loop, this.loopStart, this.loopEnd, (this.loopEnd-this.loopStart));
					setTimeout(()=>{
						this.playing = false;
						playingOther = false;
					}, (this.loopEnd-this.loopStart)*1000);
				}
				this.startTime = context.currentTime;
				this.playing = true;
			});
			
			stopBtn.on("click", () => {
				playingOther = false;
				console.log("stop:"+this.id);
				stopSound(this.bufferName);
				this.stopAt = this.loopStart + context.currentTime - this.startTime;
				this.playing = false;
			});
			
			loopBtn.on("click", () => {
				this.loop = !this.loop;
				console.log("loop is "+this.loop+":"+this.id);
				if(this.loop) loopBtn.html("Loop: ON");
				else loopBtn.html("Loop: OFF");
			});
			
			//elem.append(wave);
			elem.append(sliderDiv);
			bottomDiv.append(playBtn);
			bottomDiv.append(stopBtn);
			bottomDiv.append(loopBtn);
			elem.append(bottomDiv);
			$("#playBoxes").append(elem);
		}
	}

	var pb1 = new playBox(bufferList["test"], "test", 3, 5);
	var pb2 = new playBox(bufferList["test"], "test", 1, 3);
	var pb3 = new playBox(bufferList["test"], "test", 0, 1);
	var pb4 = new playBox(bufferList["test"], "test", 5, 7);
	pb1.creatElement();
	pb2.creatElement();
	pb3.creatElement();
	pb4.creatElement();
	
	$("#createBtn").on("click", function(){
		var loopStart = Number($("#start").val());
		var loopEnd = Number($("#end").val());
		console.log(loopStart);
		var pb = new playBox(bufferList["test"], "test", loopStart, loopEnd);
		pb.creatElement();
	});
	
	
})();