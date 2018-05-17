var pause = false;
document.getElementById('pause').onclick = function(){
	pause = !pause;
};

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

function resize() {
	canvas.width  = window.innerWidth;
	canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

var dim = 100; // 10x10
var sq = []
for(var i = 0; i < dim*dim; i++) {
	if(i % dim < dim/2) {
		sq.push(true)
	} else {
		sq.push(false)
	}
}

var t0 = performance.now();

function loop(t)
{ 
	var dt = (t - t0) / 1000; // delta t, in seconds
	t0 = t;

	var fy = 0;

	var size = Math.min(canvas.height, canvas.width) / dim;

	let newArray = []; newArray.length = dim*dim

	if (!pause) {
		for(var i = 0; i < sq.length; i++) {
			newArray[i] = decideOutcome(i)
			context.fillStyle = newArray[i] ? 'red' : 'blue'
			context.fillRect((i % dim)*size+2, Math.floor(i/dim) * size, size-4, size-4);
		}

		sq = newArray;
	}

	window.requestAnimationFrame(loop);
}

function decideOutcome(i) {

	score = 0; // probability of true gaining control of this square
	divisor = 0;

	function op(b) {
		divisor += 1;
		if(b) {
			score += 1; 
		}
	}

	op(sq[i])
	if(i % dim == 0) {
		// first column
		op(sq[i+1]) // search right
	}
	else if(i % dim == dim-1) {
		//last column
		op(sq[i-1]) // search left
	}
	else {
		op(sq[i+1]) // search right
		op(sq[i-1]) // search left
	}

	if(i < dim) {
		// first row
		op(sq[i+dim]) // search down
	}
	else if(i >= sq.length - dim) {
		// last row
		op(sq[i-dim]) // search up
	}
	else {
		op(sq[i+dim]) // search down
		op(sq[i-dim]) // search up
	}

	return (Math.random() < (score/divisor))
}
   
window.requestAnimationFrame(loop);
