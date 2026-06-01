from rest_framework import serializers
from .models import User, Rol

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    rol = RolSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'rut', 'rol', 'is_active']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    rol = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all(), required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'rut', 'password', 'rol']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user

    def to_representation(self, instance):
        return UserSerializer(instance, context=self.context).data
