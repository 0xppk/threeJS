varying vec2 vUv;
uniform float uProgress;
uniform sampler2D uCurrentPosition;
uniform sampler2D uOriginalPosition;
uniform sampler2D uOriginalPosition1;
uniform vec3 uMousePosition;
void main() {
    vec2 position = texture2D( uCurrentPosition, vUv ).xy;
    vec2 original = texture2D( uOriginalPosition, vUv ).xy;
    vec2 original1 = texture2D( uOriginalPosition1, vUv ).xy;

    vec2 finalOriginal = mix(original, original1, uProgress);

    vec2 force = finalOriginal - uMousePosition.xy;

    float len = length(force);
    float forceFactor = 1./max(1.0, len * 50.0);

    vec2 positionToGo = finalOriginal + normalize(force) * forceFactor * 0.2;

    position.xy += (positionToGo - position.xy) * 0.05;
    // gl_FragColor = vec4( vUv,0., 1.0 );
    
    gl_FragColor = vec4(position, 0.0, 1.0);
}