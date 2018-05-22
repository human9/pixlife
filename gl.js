/* 
 * gl.js
 * Keep all webgl boilerplate over here
 */

// Vertex shader program

const vsSource = `precision mediump float;

	attribute vec4 position;
	attribute vec2 texcoord;

	uniform mat4 projection;

	varying vec2 texcoord_f;

	void main() {
		texcoord_f = texcoord;
		gl_Position = projection * position;
	}
`;

const fsSource = `precision mediump float;

	varying vec2 texcoord_f;
	uniform vec2 dim;
	uniform vec2 rseed;
	uniform sampler2D sampler;
	uniform bool enabled;


	vec3 rgb2hsv(vec3 c)
	{
	    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
	    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

	    float d = q.x - min(q.w, q.y);
	    float e = 1.0e-10;
	    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
	}

	vec3 hsv2rgb(vec3 c)
	{
	    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
	}


	vec3 interpolate(vec4 from, vec4 to, float amt) {
		vec3 from_hsv = rgb2hsv(from.xyz);
		vec3 to_hsv = rgb2hsv(to.xyz);
		
		vec3 final;
		final.x = mix(from_hsv.x, to_hsv.x, amt);
		final.y = mix(from_hsv.y, to_hsv.y, amt);
		final.z = mix(from_hsv.z, to_hsv.z, amt);
		
		return hsv2rgb(final);
	}

	float rand(vec2 co)
	{
		co = co * rseed * dim * 10.;
	    float a = 12.9898;
	    float b = 78.233;
	    float c = 43758.5453;
	    float dt= dot(co.xy ,vec2(a,b));
	    float sn= mod(dt,3.14);
	    return fract(sin(sn) * c);
	}


	ivec2 decideOutcome(ivec2 texel, vec2 dim) {

		vec4 outcome = vec4(0., 0., 0., 0.);

		// u d l r
		float r = rand(texcoord_f);

		int which = int(r * 5.0);

		ivec2 t = texel;

		if(which == 0) {
			// center
			t = texel;
		}
		else if(which == 1) {
			// up
			if(texel.y < 1) {
				// down instead
				t = ivec2(texel.x, texel.y + 1);
			} else {
				t = ivec2(texel.x, texel.y - 1);
			}
		}
		else if(which == 2) {
			// right
			if(texel.x > int(dim.x)-2) {
				// left instead
				t = ivec2(texel.x - 1, texel.y);
			} else {
				t = ivec2(texel.x + 1, texel.y);
			}
		}
		else if(which == 3) {
			// down
			if(texel.y > int(dim.y)-2) {
				// up instead
				t = ivec2(texel.x, texel.y - 1);
			} else {
				t = ivec2(texel.x, texel.y + 1);
			}
		}
		else if(which == 4) {
			// left
			if(texel.x < 1) {
				// right instead
				t = ivec2(texel.x + 1, texel.y);
			} else {
				t = ivec2(texel.x - 1, texel.y);
			}
		}

		return t;
	}

	void main() {
		if (enabled) {
			ivec2 texel = ivec2(texcoord_f * dim);
			ivec2 outcome = decideOutcome(texel, dim);


			gl_FragColor = vec4(interpolate(texture2D(sampler, texcoord_f), texture2D(sampler, (vec2(outcome)+0.5)/dim), 0.99), 1.0);
		}
		else {
			gl_FragColor = texture2D(sampler, texcoord_f);
		}
	}
`;

/*
 *  Combine vertex&fragment source into compiled shader program
 */
function initShader(gl, vsSource, fsSource) {
 
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

/*
 *  Compile individual shader
 */
function compileShader(gl, type, source) {
 
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function initBuffers(gl) {


	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	const positions = [
		1.0,  1.0,
		-1.0,  1.0,
		1.0, -1.0,
		-1.0, -1.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	const textureBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	const tex = [
	0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tex), gl.STATIC_DRAW);

	return {
		position: positionBuffer,
		texcoords: textureBuffer,
	};

}

