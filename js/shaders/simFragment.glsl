varying vec2 vUv;
uniform sampler2D uTexture;
void main() {
    vec4 position = texture2D( uTexture, vUv );
    // gl_FragColor = vec4( vUv,0., 1.0 );

    position.xy += normalize(position.xy ) * 0.001;

    
    gl_FragColor = position;
}