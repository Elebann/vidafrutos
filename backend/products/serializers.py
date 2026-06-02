from rest_framework import serializers
from .models import Category, Product, RawStock, PackagedStock

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
    packaged_stock_available_stock = serializers.IntegerField(write_only=True, required=False)
    packaged_stock_minimum_stock = serializers.IntegerField(write_only=True, required=False)
    packaged_stock_allocated_stock = serializers.IntegerField(write_only=True, required=False)

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
            'packaged_stock_available_stock',
            'packaged_stock_minimum_stock',
            'packaged_stock_allocated_stock',
        ]

    def update(self, instance, validated_data):
        # handle raw stock update if provided
        raw_total = validated_data.pop('raw_stock_total_grams', None)
        packaged_available = validated_data.pop('packaged_stock_available_stock', None)
        packaged_minimum = validated_data.pop('packaged_stock_minimum_stock', None)
        packaged_allocated = validated_data.pop('packaged_stock_allocated_stock', None)
        instance = super().update(instance, validated_data)
        if raw_total is not None:
            # update or create the RawStock one-to-one record
            RawStock.objects.update_or_create(product=instance, defaults={'total_grams': raw_total})
        if packaged_available is not None or packaged_minimum is not None or packaged_allocated is not None:
            try:
                packaged = PackagedStock.objects.get(product=instance)
                if packaged_available is not None:
                    packaged.available_stock = packaged_available
                if packaged_minimum is not None:
                    packaged.minimum_stock = packaged_minimum
                if packaged_allocated is not None:
                    packaged.allocated_stock = packaged_allocated
                packaged.save()
            except PackagedStock.DoesNotExist:
                PackagedStock.objects.create(
                    product=instance,
                    available_stock=packaged_available if packaged_available is not None else 0,
                    allocated_stock=packaged_allocated if packaged_allocated is not None else 0,
                    minimum_stock=packaged_minimum if packaged_minimum is not None else 0,
                )
        return instance

    def create(self, validated_data):
        raw_total = validated_data.pop('raw_stock_total_grams', None)
        packaged_available = validated_data.pop('packaged_stock_available_stock', None)
        packaged_minimum = validated_data.pop('packaged_stock_minimum_stock', None)
        packaged_allocated = validated_data.pop('packaged_stock_allocated_stock', None)
        instance = super().create(validated_data)
        if raw_total is not None:
            RawStock.objects.update_or_create(product=instance, defaults={'total_grams': raw_total})
        if packaged_available is not None or packaged_minimum is not None or packaged_allocated is not None:
            PackagedStock.objects.update_or_create(
                product=instance,
                defaults={
                    'available_stock': packaged_available if packaged_available is not None else 0,
                    'allocated_stock': packaged_allocated if packaged_allocated is not None else 0,
                    'minimum_stock': packaged_minimum if packaged_minimum is not None else 0,
                },
            )
        return instance
