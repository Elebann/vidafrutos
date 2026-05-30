from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Customer
from .serializers import CustomerSerializer


class ClientsViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for customers. Protected by authentication."""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
