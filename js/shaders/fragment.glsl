varying vec2 vUv;
uniform sampler2D uTexture;
varying vec3 vNormal;
void main() {
    vec4 color = texture2D( uTexture, vUv );
    gl_FragColor = vec4( vNormal, 1. );
    // gl_FragColor = color;
}
