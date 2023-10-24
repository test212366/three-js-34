uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;
uniform vec3 uLight;
varying vec3 vNormal;
varying vec3 v_wordPosition;

float PI = 3.1415926;




float getScatter(vec3 cameraPos, vec3 dir, vec3 lightPos, float d) {
	vec3 q = cameraPos - lightPos;


	float b = dot(dir, q);
	float c = dot(q, q);

	float t = c - b * b;
	float s = 1.0 / sqrt(max(0.0001, t));
	float l = s * (atan((d + b) * s) - atan(b * s));
	return pow(max(0.0, l / 150.0), 0.4);

}



void main() {
	vec3 cameraToWorld = v_wordPosition - cameraPosition;
	vec3 cameraToWorldDir = normalize(cameraToWorld);

	float cameraToWorldDistance = length(cameraToWorld);



	vec3 lightToWorld = normalize(uLight - v_wordPosition);


	float diffusion = max(0.,dot(vNormal, lightToWorld));
	float dist = length(uLight - vPosition);

	float scatter = getScatter(cameraPosition, cameraToWorldDir,uLight, cameraToWorldDistance);


	float final = diffusion * scatter;



	gl_FragColor = vec4( 1. - dist, 0., 0., 1.);
	gl_FragColor = vec4( scatter, 0., 0., 1.);

	// gl_FragColor = vec4(vNormal, 1.);
}