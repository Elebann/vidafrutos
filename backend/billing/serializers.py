from rest_framework import serializers
from .models import Invoice
from orders.serializers import OrderSerializer
from accounts.serializers import UserSerializer


class InvoiceSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Invoice
        fields = ['id', 'order', 'user', 'date', 'total', 'payment_method']
