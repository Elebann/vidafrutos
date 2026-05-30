from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import RawStockMovement
from .serializers import RawStockMovementSerializer


class RawStockMovementViewSet(viewsets.ModelViewSet):
    """CRUD for raw stock movements. Protected by authentication."""
    queryset = RawStockMovement.objects.select_related('product', 'user').all()
    serializer_class = RawStockMovementSerializer
    permission_classes = [IsAuthenticated]
