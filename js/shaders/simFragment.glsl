varying vec2 vUv;
uniform float uProgress;
uniform vec3 uSource;
uniform int uRenderMode;
uniform sampler2D uCurrentPosition;
uniform sampler2D uDirections;
uniform vec3 uMouse;
uniform float uTime;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float offset = rand(vUv);
  vec3 position = texture2D(uCurrentPosition, vUv).xyz;
  vec3 direction = texture2D(uDirections, vUv).xyz;

  float ran1 = rand(vUv) - 0.5;
  float ran2 = rand(vUv + vec2(0.1, 0.1)) - 0.5;
  float ran3 = rand(vUv + vec2(0.3, 0.3)) - 0.5;

  switch (uRenderMode) {
    case 0:
      position.xyz += direction * 0.01;
      gl_FragColor = vec4(position, 1.0);
      break;
    case 1: // Direction
      gl_FragColor = vec4(uSource + vec3(ran1, ran2, ran3), 1.0);
      break;
    case 2: // Position
      gl_FragColor = vec4(uSource + vec3(ran1, ran2, ran3) * 0.1, 1.0);
      break;
  }
}
