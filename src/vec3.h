#include <cmath>

class Vec3 {
    public:
        float x, y, z;
        Vec3(float x, float y, float z) {
            this->x = x;
            this->y = y;
            this->z = z;
        }
        Vec3() {
            this->x = 0;
            this->y = 0;
            this->z = 0;
        }
        Vec3 operator+(const Vec3& v) {
            return Vec3(this->x + v.x, this->y + v.y, this->z + v.z);
        }
        Vec3 operator-(const Vec3& v) {
            return Vec3(this->x - v.x, this->y - v.y, this->z - v.z);
        }
        Vec3 operator*(const float& f) {
            return Vec3(this->x * f, this->y * f, this->z * f);
        }
        Vec3 operator/(const float& f) {
            return Vec3(this->x / f, this->y / f, this->z / f);
        }
        Vec3 operator+=(const Vec3& v) {
            this->x += v.x;
            this->y += v.y;
            this->z += v.z;
            return *this;
        }
        Vec3 operator-=(const Vec3& v) {
            this->x -= v.x;
            this->y -= v.y;
            this->z -= v.z;
            return *this;
        }
        Vec3 operator*=(const float& f) {
            this->x *= f;
            this->y *= f;
            this->z *= f;
            return *this;
        }
        Vec3 operator/=(const float& f) {
            this->x /= f;
            this->y /= f;
            this->z /= f;
            return *this;
        }
        float dot(const Vec3& v) {
            return this->x * v.x + this->y * v.y + this->z * v.z;
        }
        Vec3 cross(const Vec3& v) {
            return Vec3(this->y * v.z - this->z * v.y, this->z * v.x - this->x * v.z, this->x * v.y - this->y * v.x);
        }
        float length() {
            return sqrt(this->x * this->x + this->y * this->y + this->z * this->z);
        }
        Vec3 normalize() {
            float len = this->length();
            return Vec3(this->x / len, this->y / len, this->z / len);
        }
        Vec3 rotate(float angle, Vec3 axis) {
            axis = axis.normalize();
            float s = sin(angle);
            float c = cos(angle);
            float oc = 1.0f - c;
            return Vec3(
                (oc * axis.x * axis.x + c) * this->x + (oc * axis.x * axis.y - axis.z * s) * this->y + (oc * axis.z * axis.x + axis.y * s) * this->z,
                (oc * axis.x * axis.y + axis.z * s) * this->x + (oc * axis.y * axis.y + c) * this->y + (oc * axis.y * axis.z - axis.x * s) * this->z,
                (oc * axis.z * axis.x - axis.y * s) * this->x + (oc * axis.y * axis.z + axis.x * s) * this->y + (oc * axis.z * axis.z + c) * this->z
            );
        }
};