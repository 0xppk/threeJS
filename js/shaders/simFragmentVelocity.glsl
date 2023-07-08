uniform sampler2D uOriginalPosition;
uniform float uProgress;
uniform vec3 uMouse;
uniform float uTime;
// float rand(vec2 co){
//     return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5433);
// }
void main() {
    vec2 vUv = gl_FragCoord.xy / resolution.xy;
    vec3 position = texture2D( uCurrentPosition, vUv ).xyz;
    vec3 original = texture2D( uOriginalPosition, vUv ).xyz;
    vec3 velocity = texture2D( uCurrentVelocity, vUv ).xyz;
    // float offset = rand(vUv);
    // vec2 velocity = texture2D( uCurrentPosition, vUv ).zw;
    // vec3 finalOriginal = mix(original, original1, uProgress);

    // resilence
    velocity *= 0.9;


    // particle attraction to shape force
    vec3 direction = normalize( original - position );
    float dist = length( original - position );
    if( dist > 0.01 ) {
        velocity += direction  * 0.001;
    }
    

    // mouse repel force
    float mouseDistance = distance( position, uMouse );
    float maxDistance = 0.1;
    if( mouseDistance < maxDistance ) {
        vec3 direction = normalize( position - uMouse );
        velocity += direction * ( 1.0 - mouseDistance / maxDistance ) * 0.01;
    }

    // life span of a particle
    // float lifespan = 10.;
    // float age = mod(uTime + lifespan * offset, lifespan);
    // if( age < 0.1 ) {
    //     // velocity = vec2(0.0, 0.001);
    //     position.xyz = finalOriginal;
    // }

    // position.xy += velocity;

    gl_FragColor = vec4(velocity, 1.);
}

// vec2 force = finalOriginal - uMouse.xy;

//     float len = length(force);
//     float forceFactor = 1./max(1.0, len * 50.0);

//     vec2 positionToGo = finalOriginal + normalize(force) * forceFactor * 0.2;

//     position.xy += (positionToGo - position.xy) * 0.05;
//     gl_FragColor = vec4( vUv,0., 1.0 );
    




