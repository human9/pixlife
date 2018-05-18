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

var dim = 128
var sq = []
for(var i = 0; i < dim*dim; i++) {
	if(i % dim < dim/2) {
		sq.push(0)
	} else {
		sq.push(240)
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
			context.fillStyle = 'hsl(' + newArray[i] + ', 90%, 60%)'
			context.fillRect((i % dim)*size, Math.floor(i/dim) * size, size, size);
		}

		sq = newArray;
	}

	window.requestAnimationFrame(loop);
}

function decideOutcome(i) {


	opts = []

	function op(b) {
		opts.push(b)
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

	end =  opts[Math.floor(Math.random() * opts.length)]
	return (end - sq[i]) * 0.99 + sq[i];

}

window.requestAnimationFrame(loop);
