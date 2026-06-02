from rest_framework import serializers
from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['id', 'order', 'user', 'date', 'total', 'payment_method']
        read_only_fields = ['id', 'user', 'date']
