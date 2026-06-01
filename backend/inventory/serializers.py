from rest_framework import serializers
from .models import RawStockMovement
from products.serializers import ProductSerializer
from accounts.serializers import UserSerializer
from products.models import Product
from accounts.models import User


class RawStockMovementSerializer(serializers.ModelSerializer):
    # keep read-only nested representations for responses
    product = ProductSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    # accept ids for writes
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), write_only=True, source='product')
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='user', required=False)

    class Meta:
        model = RawStockMovement
        fields = ['id', 'product', 'product_id', 'user', 'user_id', 'movement_type', 'quantity', 'date', 'description']

    def create(self, validated_data):
        # If user not provided explicitly, use the request user (from serializer context)
        if 'user' not in validated_data or validated_data.get('user') is None:
            request = self.context.get('request', None)
            if request and hasattr(request, 'user'):
                validated_data['user'] = request.user
        return super().create(validated_data)
