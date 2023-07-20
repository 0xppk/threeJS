varying vec2 vUv;
uniform float uProgress;
uniform sampler2D uCurrentPosition;
uniform sampler2D uOriginalPosition;
uniform sampler2D uOriginalPosition1;
uniform vec3 uMousePosition;
uniform float uTime;
float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5433);
}
void main() {
    float offset = rand(vUv);
    vec2 position = texture2D( uCurrentPosition, vUv ).xy;
    vec2 original = texture2D( uOriginalPosition, vUv ).xy;
    vec2 original1 = texture2D( uOriginalPosition1, vUv ).xy;

    vec2 velocity = texture2D( uCurrentPosition, vUv ).zw;

    vec2 finalOriginal = mix(original, original1, uProgress);

    // resilence
    velocity *= 0.99;

    // particle attraction to shape force
    vec2 direction = normalize(finalOriginal - position);
    float dist = length(finalOriginal - position);
    if( dist > 0.01 ) {
        velocity += direction * 0.0001;
    }

    // mouse repel force
    float mouseDistance = distance( position, uMousePosition.xy );
    float maxDistance = 0.1;
    if( mouseDistance < maxDistance ) {
        vec2 direction = normalize(position - uMousePosition.xy);
        velocity += direction * (1.0 - (mouseDistance / maxDistance)) * 0.001;
    }

    // life span of a particle
    float lifespan = 10.0;
    float age = mod(uTime + lifespan * offset, lifespan);
    if( age < 0.1 ) {
        velocity = vec2(0.0, 0.001);
        position.xy = finalOriginal;
    }

    position.xy += velocity;
    gl_FragColor = vec4(position, velocity);
}

// vec2 force = finalOriginal - uMousePosition.xy;

//     float len = length(force);
//     float forceFactor = 1./max(1.0, len * 50.0);

//     vec2 positionToGo = finalOriginal + normalize(force) * forceFactor * 0.2;

//     position.xy += (positionToGo - position.xy) * 0.05;
//     gl_FragColor = vec4( vUv,0., 1.0 );
    
