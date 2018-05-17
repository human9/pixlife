var hidden = true;
document.getElementById('show').onclick = function(){
	if(hidden) {
        	document.getElementById('side').style.width = '200px';
	} else {
        	document.getElementById('side').style.width = '0';
	}
	hidden = !hidden;
};
document.getElementById('full').onclick = function(){
	if(!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement)
	{
		var elem = document.getElementsByTagName('body')[0];
		var requestFullScreen = elem.requestFullscreen || elem.msRequestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullscreen;
		requestFullScreen.call(elem);
	}
	else {
		var exitFullScreen = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
		exitFullScreen.call(document);
	}

};

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

function resize() {
	canvas.width  = window.innerWidth;
	canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

var x = 200,
    y = 0,
    vy = 0,
    ay = 0,
    m = 0.1,    // Ball mass in kg
    r = 10,     // Ball radius in cm, or pixels.
    e = -0.5,   // Coefficient of restitution ("bounciness")
    rho = 1.2,  // Density of air. Try 1000 for water.
    C_d = 0.47, // Coeffecient of drag for a ball
    A = Math.PI * r * r / 10000 // Frontal area of the ball; divided by 10000 to compensate for the 1px = 1cm relation
    ;

var t0 = performance.now();

function loop(t)
{ 

	var dt = (t - t0) / 1000; // delta t, in seconds
	t0 = t;

	var fy = 0;

	/* Weight force, which only affects the y-direction (because that's the direction gravity points). */
	fy += m * 9.81;

	/* Air resistance force; this would affect both x- and y-directions, but we're only looking at the y-axis in this example. */
	fy += -1 * 0.5 * rho * C_d * A * vy * vy;

	/* Verlet integration for the y-direction */
	dy = vy * dt + (0.5 * ay * dt * dt);
	/* The following line is because the math assumes meters but we're assuming 1 cm per pixel, so we need to scale the results */
	y += dy * 100;
	new_ay = fy / m;
	avg_ay = 0.5 * (new_ay + ay);
	vy += avg_ay * dt;

	/* Let's do very simple collision detection */
	if (y + r > canvas.height && vy > 0) {
		/* This is a simplification of impulse-momentum collision response. e should be a negative number, which will change the velocity's direction. */
		vy *= e; 
		/* Move the ball back a little bit so it's not still "stuck" in the wall. */
		y = canvas.height - r;                        
	}
	draw();
	window.requestAnimationFrame(loop);
}

function draw() {
	context.fillStyle = 'red';
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.beginPath();
	context.arc(x, y, r, 0, Math.PI * 2, true);
	context.fill();
	context.closePath();
}
   
window.requestAnimationFrame(loop);
