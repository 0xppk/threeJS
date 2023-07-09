vec3 rotate3D(inout float3 v, float3 vel){
  vec3 newpos = v;
  vec3 up= = vec3(0,1,0);
  vec3 axis = normalize(cross(up,vel));
  float angle = acos(dot(up, normalize(vel)));
  newpos = newpos * cos(amgle) + cross(axis, newpos) * sin(angle) + axis * dot(axis, newpos) * (1.0 - cos(angle));
  return newpos;
}