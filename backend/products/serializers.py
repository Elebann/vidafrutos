from rest_framework import serializers
from .models import Category, Product, RawStock, PackagedStock
from .models import RawStock

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class RawStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawStock
        fields = ['total_grams']

class PackagedStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackagedStock
        fields = ['available_stock', 'allocated_stock', 'minimum_stock']

class ProductSerializer(serializers.ModelSerializer):
    raw_stock = RawStockSerializer(read_only=True)
    packaged_stock = PackagedStockSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    # allow updating raw stock total grams via a write-only field
    raw_stock_total_grams = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'price',
            'active',
            'grams',
            'category',
            'category_name',
            'raw_stock',
            'packaged_stock',
            'raw_stock_total_grams',
        ]

    def update(self, instance, validated_data):
        # handle raw stock update if provided
        raw_total = validated_data.pop('raw_stock_total_grams', None)
        instance = super().update(instance, validated_data)
        if raw_total is not None:
            # update or create the RawStock one-to-one record
            RawStock.objects.update_or_create(product=instance, defaults={'total_grams': raw_total})
        return instance

    def create(self, validated_data):
        raw_total = validated_data.pop('raw_stock_total_grams', None)
        instance = super().create(validated_data)
        if raw_total is not None:
            RawStock.objects.update_or_create(product=instance, defaults={'total_grams': raw_total})
        return instance
