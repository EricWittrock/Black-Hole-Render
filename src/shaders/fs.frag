#version 460 core

out vec4 FragColor;

in vec2 pos;

uniform vec3 cameraPos;
uniform vec3 cameraDir;
uniform sampler2D tex;
uniform float time;

 // t, r, theta, phi
mat4 getMetric(vec4 x) {

    const float scale = 1.0+10;
    const float c = 299792458.0*scale;
    const float c2 = c*c;
    const float G = 6.67408e-11;
    const float M = 1.989e32*scale;
    
    float t = x.x;
    float r = x.y;
    float theta = x.z;
    float phi = x.w;

    // minkowski metric
    mat4 m = mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, -1.0, 0.0, 0.0,
        0.0, 0.0, -1.0, 0.0,
        0.0, 0.0, 0.0, -1.0
    );

    // minkowski sphere metric
    /*mat4 m = mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, -1.0, 0.0, 0.0,
        0.0, 0.0, -r*r, 0.0,
        0.0, 0.0, 0.0, -r*r*sin(theta)*sin(theta)
    );

    // shwarzchild metric
    /*mat4 m = mat4(
        1.0 - 2.0 / x[0], 0.0, 0.0, 0.0,
        0.0, 1.0 / (1.0 - 2.0 / x[0]), 0.0, 0.0,
        0.0, 0.0, x[0] * x[0], 0.0,
        0.0, 0.0, 0.0, x[0] * x[0] * sin(x[2]) * sin(x[2])
    );*/
    return m;
}

// returns the inverse of a 4x4 matrix
mat4 inverse4(mat4 m) {
    float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3];
    float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3];
    float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3];
    float a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3];

    float b00 = a00 * a11 - a01 * a10;
    float b01 = a00 * a12 - a02 * a10;
    float b02 = a00 * a13 - a03 * a10;
    float b03 = a01 * a12 - a02 * a11;
    float b04 = a01 * a13 - a03 * a11;
    float b05 = a02 * a13 - a03 * a12;
    float b06 = a20 * a31 - a21 * a30;
    float b07 = a20 * a32 - a22 * a30;
    float b08 = a20 * a33 - a23 * a30;
    float b09 = a21 * a32 - a22 * a31;
    float b10 = a21 * a33 - a23 * a31;
    float b11 = a22 * a33 - a23 * a32;

    float det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    return mat4(
        a11 * b11 - a12 * b10 + a13 * b09,
        a02 * b10 - a01 * b11 - a03 * b09,
        a31 * b05 - a32 * b04 + a33 * b03,
        a22 * b04 - a21 * b05 - a23 * b03,
        a12 * b08 - a10 * b11 - a13 * b07,
        a00 * b11 - a02 * b08 + a03 * b07,
        a32 * b02 - a30 * b05 - a33 * b01,
        a20 * b05 - a22 * b02 + a23 * b01,
        a10 * b10 - a11 * b08 + a13 * b06,
        a01 * b08 - a00 * b10 - a03 * b06,
        a30 * b04 - a31 * b02 + a33 * b00,
        a21 * b02 - a20 * b04 - a23 * b00,
        a11 * b07 - a10 * b09 - a12 * b06,
        a00 * b09 - a01 * b07 + a02 * b06,
        a31 * b01 - a30 * b03 - a32 * b00,
        a20 * b03 - a21 * b01 + a22 * b00) / det;
}

// get partial dirivative of tensor with respect to x0
/*mat4 getDerivativeX0(float x0, float x1, float x2, float x3) {
    const float k = 0.0001;
    mat4 m1 = getMetric(x0,x1,x2,x3);
    mat4 m2 = getMetric(x0+k,x1,x2,x3);
    return (m2-m1)/k;
}*/

mat4 getChristoffel(vec4 x, int alpha) {
    const float k = 0.00000000001;
    mat4 m = getMetric(x); // metric tensort at event x
    mat4 mInv = inverse4(m); // inverse of metric tensor
    
    // partial derivatives
    mat4 d1 = (getMetric(x + vec4(k,0,0,0))-m)/k;
    mat4 d2 = (getMetric(x + vec4(0,k,0,0))-m)/k;
    mat4 d3 = (getMetric(x + vec4(0,0,k,0))-m)/k;
    mat4 d4 = (getMetric(x + vec4(0,0,0,k))-m)/k;

    // christoffel symbols
    mat4 c = mat4(0.0);
    for(int beta = 0; beta < 4; beta++) {
        for(int gamma = 0; gamma < 4; gamma++) {
            float sum = 0.0;
            for(int sigma = 0; sigma < 4; sigma++) {
                mat4 d_sigma;
                switch(sigma){
                    case 0: d_sigma = d1; break;
                    case 1: d_sigma = d2; break;
                    case 2: d_sigma = d3; break;
                    case 3: d_sigma = d4; break;
                }
                mat4 d_gamma;
                switch(gamma){
                    case 0: d_gamma = d1; break;
                    case 1: d_gamma = d2; break;
                    case 2: d_gamma = d3; break;
                    case 3: d_gamma = d4; break;
                }
                mat4 d_beta;
                switch(beta){
                    case 0: d_beta = d1; break;
                    case 1: d_beta = d2; break;
                    case 2: d_beta = d3; break;
                    case 3: d_beta = d4; break;
                }
                sum += 0.5*mInv[alpha][sigma]*(d_gamma[sigma][beta] + d_beta[sigma][gamma] - d_sigma[beta][gamma]);
            }
            c[beta][gamma] = sum;
        }
    } 
    return c;
}

vec4 getAcceleration(vec4 v, vec4 pos) {
    vec4 a = vec4(0.0);
    for(int alpha = 0; alpha<4; alpha++) {
        mat4 c = getChristoffel(pos, alpha);
        for(int mu = 0; mu<4; mu++){
            for(int nu = 0; nu<4; nu++) {
                a[alpha] -= c[mu][nu]*v[mu]*v[nu];
            }
        }
    }
    return a;
}

float getAng(vec4 v1, vec4 v2) {
    return acos(dot(v1,v2)/(length(v1)*length(v2)));
}

vec3 rotateVecAboutAxis(vec3 v, vec3 axis, float angle) {
    vec3 v1 = v*cos(angle);
    vec3 v2 = cross(axis, v)*sin(angle);
    vec3 v3 = axis*dot(axis, v)*(1.0-cos(angle));
    return v1+v2+v3;
}


// convert cartesian to spherical coordinates
vec3 toSph(vec3 cart) {
    float x = cart.x;
    float y = cart.y;
    float z = cart.z;
    float r = length(cart);
    float theta = acos(z/r);
    float phi = atan(y,x);
    return vec3(r, theta, phi);
}

// convert spherical to cartesian coordinates
vec3 toCart(vec3 sph) {
    float r = sph.x;
    float theta = sph.y;
    float phi = sph.z;
    float x = r*sin(theta)*cos(phi);
    float y = r*sin(theta)*sin(phi);
    float z = r*cos(theta);
    return vec3(x,y,z);
}


// converts direction to hrd coordinates
vec2 dirToHrd(vec3 dir) {
    vec2 hrd = vec2(atan(dir.z, dir.x), -asin(dir.y));
    hrd = hrd / 3.14159265359*0.5 + 0.5;
    return hrd;
}

vec3 linePlaneIntesection(vec3 linePoint, vec3 lineDir, vec3 planePoint, vec3 planeNormal)
{
    float d = dot(planeNormal, lineDir);
    if (d == 0.0)
        return vec3(0.0, 0.0, 0.0);
    float t = dot(planePoint - linePoint, planeNormal) / d;
    return linePoint + lineDir * t;
}

// return the point where the line intresects the sphere
vec3 lineSphereIntersection(vec3 linePoint, vec3 lineDir, vec3 sphereCenter, float sphereRadius)
{
    vec3 m = linePoint - sphereCenter;
    float b = dot(m, lineDir);
    float c = dot(m, m) - sphereRadius * sphereRadius;
    // Exit if r’s origin outside s (c > 0) and r pointing away from s (b > 0)
    if (c > 0.0 && b > 0.0)
        return vec3(0.0, 0.0, 0.0);
    float discr = b * b - c;
    // A negative discriminant corresponds to ray missing sphere
    if (discr < 0.0)
        return vec3(0.0, 0.0, 0.0);
    // Ray now found to intersect sphere, compute smallest t value of intersection
    float t = -b - sqrt(discr);
    // If t is negative, ray started inside sphere so clamp t to zero
    if (t < 0.0)
        t = 0.0;
    return linePoint + lineDir * t;
}

void main()
{
    // focal length
    const float focal = 1.4;
    // sphere pos
    const vec3 spherePos = vec3(0.0, 0.0, 0.0);
    // sphere radius
    const float sphereRadius = 2.0;
    // step size for ray marching
    const float rayStep = 1.0;
    // how many steps to take
    const int iterations = 70;

    // ray direction
    vec3 rayDir = normalize(vec3(pos.x, pos.y, focal));
    // create a rotation matrix from cameraDir
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(cameraDir, up));
    up = normalize(cross(right, cameraDir));
    mat3 rot = mat3(right, up, cameraDir);
    // rotate rayDir away from apeture
    rayDir = rot * rayDir;
    vec3 rayPos = cameraPos;

    float vr = dot(rayDir, normalize(spherePos-rayPos));
    

    vec3 color = vec3(0.0, 0.0, 0.3);

    const float scale = 1.0e-2;
    const float c = 299792458.0*scale;
    const float c2 = c*c;
    const float G = 6.67408e-11;
    const float M = 1.989e32*scale;
    // ray marching
    for (int i = 0; i < iterations; i++)
    {
        // approximation via newtonian gravity
        float force = 1.0 / pow(length(rayPos - spherePos), 2.0);
        vec3 forceVec = normalize(spherePos - rayPos) * force;

        rayDir += forceVec;
        rayDir = normalize(rayDir);

        // move light ray forward
        rayPos += rayDir*rayStep;


        // float angle = getAng(vec4(0,1,0,0), vec4(0.0, rayDir));
        // rayPos = rotateVecAboutAxis(rayPos, vec3(0,0,1), -angle);
        // vec3 sphPos = toSph(rayPos);

        // vr += 0.1*(sphPos.x - 3*G*M/(c2))*sphPos.z;
        // float vphi = 1.0/(sphPos.x*sphPos.x);
        // sphPos.x += vr;
        // sphPos.z += vphi;

        // rayPos = toCart(sphPos);
        // rayPos = rotateVecAboutAxis(rayPos, vec3(0,0,1), angle);

        // rayDir = normalize(rayDir);

        vec3 planeIntersect = linePlaneIntesection(rayPos, rayDir, spherePos, normalize(vec3(0.0,0.4,0.0)) );
        float radialDist = length(planeIntersect-spherePos);
        float planeDist = length(planeIntersect - rayPos);
        float planeDist2 = length(planeIntersect - (rayPos+rayDir*rayStep));
        bool hitPlane = (radialDist < 8 && radialDist > 3 && planeDist <= rayStep && planeDist2 <= rayStep); // within disk radius

        // intersect with disk
        if(hitPlane)
        {
            float radialAngle = atan(planeIntersect.x-spherePos.x, planeIntersect.z-spherePos.z)+time*0.01;
            if(int(radialAngle*7)%2 != int(radialDist)%2){
              color = vec3(0.5, 0.5, 0.6);
              break;
            }
            color = vec3(0.0, 0.7, 0.2);
            break;
        }

        if(i == iterations-1) {
          // light ray is trapped because it hasn't gone far away yet
          if(length(rayPos) < 20){
            color = vec3(0.0, 0.0, 0.0);
            break;
          }
          // light ray hits the backdrop
          color = texture(tex, dirToHrd(normalize(rayPos))).rgb;
        }
    }

    FragColor = vec4(color, 1.0f);
}