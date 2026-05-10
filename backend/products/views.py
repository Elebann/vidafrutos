from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related(
        'category',
        'raw_stock',
        'packaged_stock'
    ).all()
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        active = self.request.query_params.get('active')
        if active is not None:
            queryset = queryset.filter(active=active.lower() == 'true')
        return queryset

    @action(detail=False, methods=['get'], url_path='low-stock')
    def low_stock(self, request):
        products = self.get_queryset().filter(
            packaged_stock__available_stock__lt=F('packaged_stock__minimum_stock'),
            active=True
        )
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)