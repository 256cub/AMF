function do_instagram_like(){

	state = _STATE_WAIT_TO_CLOSE;
	wait_time = generateRandom(5, 8);
	
	var sec = document.querySelector('section._aamu');
	if(!sec) { return; }
	
	var btns = sec.querySelectorAll("svg._ab6-");
	if(!btns) { return; }
	
	for(var i=0; i<btns.length; i++){
		var svgs = btns[i].querySelectorAll('svg[aria-label="Like"]');
		if(svgs){
			btns[i].parentNode.click();
			break;
		}
	}
}

function do_instagram_follow(){

	state = _STATE_WAIT_TO_CLOSE;
	wait_time = generateRandom(5, 8);

	var btns = document.querySelectorAll("button");
	if(!btns) { return false; }
	if(btns.length < 1) { return false; }

	for(var i=0; i<btns.length; i++){
		if(btns[i].textContent == "Follow") {

			btns[i].click();
			console.log("Followed !");
			break;
		}
	}	
}

var instagram_done = false;

function do_instagram(){
	
	// wait for 5 seconds
	if(tick_count < 2) { return; }
	
	if(tick_count > _TIMEOUT_IN_SECS) {
		// timeout
		window.close();
	}

	if(instagram_done) { return; }
	instagram_done = true;
	
	console.log("do_instagram");
	console.log("config.actionType = "+config.actionType);
	
	if (config.actionType === _ACTION_TYPE_INSTAGRAM_LIKE) {
		
		console.log("do_instagram_like");
		do_instagram_like();
		return;
	}
	
	if (config.actionType === _ACTION_TYPE_INSTAGRAM_FOLLOW) {
		console.log("do_instagram_follow");
		do_instagram_follow();
		return;
	}
}