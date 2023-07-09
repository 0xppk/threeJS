varying vec2 vUv;
uniform sampler2D uTexture;
uniform sampler2D uMatcap;
varying vec3 vNormal;
varying vec3 vViewPosition;
void main() {
    vec3 viewDir = normalize( vViewPosition );
    vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
    vec3 y = cross( viewDir, x );
    vec2 uv = vec2( dot(x, vNormal), dot(y, vNormal) ) * 0.495 + 0.5;

    vec4 matcapColor = texture2D( uMatcap, uv );

    vec4 color = texture2D( uTexture, vUv );
    gl_FragColor = vec4( vNormal, 1. );
    gl_FragColor = matcapColor;
}
