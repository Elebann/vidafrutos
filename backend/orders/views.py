from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import History, Order, OrderDetail, OrderState
from .serializers import (
	HistorySerializer,
	HistoryWriteSerializer,
	OrderDetailSerializer,
	OrderDetailWriteSerializer,
	OrderSerializer,
	OrderWithDetailsSerializer,
	OrderStateSerializer,
	OrderStateWriteSerializer,
	OrderWriteSerializer,
)


class OrderStateViewSet(viewsets.ModelViewSet):
	queryset = OrderState.objects.all()

	def get_serializer_class(self):
		if self.action in ['create', 'update', 'partial_update']:
			return OrderStateWriteSerializer
		return OrderStateSerializer


class OrderViewSet(viewsets.ModelViewSet):
	queryset = Order.objects.select_related('customer', 'state').prefetch_related('orderdetail_set__product').all()

	def get_queryset(self):
		queryset = super().get_queryset()
		customer_id = self.request.GET.get('customer')
		state_id = self.request.GET.get('state')

		if customer_id:
			queryset = queryset.filter(customer_id=customer_id)
		if state_id:
			queryset = queryset.filter(state_id=state_id)

		return queryset

	def get_serializer_class(self):
		if self.action in ['create', 'update', 'partial_update']:
			return OrderWriteSerializer
		return OrderSerializer

	@action(detail=True, methods=['get'], url_path='details')
	def details(self, request, pk=None):
		order = self.get_object()
		serializer = OrderWithDetailsSerializer(order)
		return Response(serializer.data)


class OrderDetailViewSet(viewsets.ModelViewSet):
	queryset = OrderDetail.objects.select_related('order', 'product').all()

	def get_serializer_class(self):
		if self.action in ['create', 'update', 'partial_update']:
			return OrderDetailWriteSerializer
		return OrderDetailSerializer


class HistoryViewSet(viewsets.ModelViewSet):
	queryset = History.objects.select_related('order', 'user').all()

	def get_serializer_class(self):
		if self.action in ['create', 'update', 'partial_update']:
			return HistoryWriteSerializer
		return HistorySerializer
