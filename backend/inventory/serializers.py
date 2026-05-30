from rest_framework import serializers
from .models import RawStockMovement
from products.serializers import ProductSerializer
from accounts.serializers import UserSerializer


class RawStockMovementSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = RawStockMovement
        fields = ['id', 'product', 'user', 'movement_type', 'quantity', 'date', 'description']
