uniform float uRadius;
uniform sampler2D uTexture;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

float drawCircle(vec2 position, vec2 center) {
  return step(uRadius, distance(position, center));
}
void main() {
  // Line
  // vec3(step(0.99, 1.0 - abs(vUv.y - 0.5))), 1.0

  // Circle
  // vec3(step(uRadius, length(vUv - 0.5))), 1

  const vec3 DESATURATE = vec3(0.2126, 0.7152, 0.0722);
  vec3 color = texture2D(uTexture, vUv).xyz;

  float finalColor = dot(DESATURATE, color);
  gl_FragColor = vec4(vec3(finalColor), 1);
}
