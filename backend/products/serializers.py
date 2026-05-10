from rest_framework import serializers
from .models import Category, Product, RawStock, PackagedStock

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class RawStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawStock
        fields = ['quantity_kilogram']

class PackagedStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackagedStock
        fields = ['available_stock', 'allocated_stock', 'minimum_stock']

class ProductSerializer(serializers.ModelSerializer):
    raw_stock = RawStockSerializer(read_only=True)
    packaged_stock = PackagedStockSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'price',
            'active',
            'category',
            'category_name',
            'raw_stock',
            'packaged_stock',
        ]