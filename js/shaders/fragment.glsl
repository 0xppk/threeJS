varying vec2 vUv;
uniform sampler2D uTexture;
varying float vLife;
void main() {
  if (vLife < 0.001) discard;
  vec4 color = texture2D(uTexture, vUv);
  gl_FragColor = vec4(1.0, 1.0, 1.0, 0.5 * vLife);
}
