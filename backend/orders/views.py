from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import DeliveryEvidence, History, Order, OrderDetail, OrderState
from .serializers import (
	DeliveryEvidenceSerializer,
	DeliveryEvidenceWriteSerializer,
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

	@action(detail=True, methods=['get', 'post'], url_path='details')
	def details(self, request, pk=None):
		order = self.get_object()
		# GET: return nested order with details
		if request.method == 'GET':
			serializer = OrderWithDetailsSerializer(order)
			return Response(serializer.data)

		# POST: allow creating one or many OrderDetail entries for this order
		# Expect payload as either a single object {product: <id>, quantity: <n>} or a list of such objects
		data = request.data
		items = data if isinstance(data, list) else [data]
		created = []
		for item in items:
			# ensure order is set to this order
			payload = dict(item)
			payload['order'] = order.id
			serializer = OrderDetailWriteSerializer(data=payload)
			serializer.is_valid(raise_exception=True)
			serializer.save()
			created.append(serializer.data)

		return Response(created, status=201)

	@action(detail=True, methods=['get', 'post'], url_path='evidence')
	def evidence(self, request, pk=None):
		order = self.get_object()

		if request.method == 'GET':
			evidence_type = request.query_params.get('evidence_type')

			evidence = DeliveryEvidence.objects.filter(
				order=order,
				evidence_type=evidence_type,
			).first()

			if evidence is None:
				return Response(None, status=status.HTTP_200_OK)

			return Response(
				DeliveryEvidenceSerializer(
					evidence,
					context={'request': request}
				).data
			)

		write_serializer = DeliveryEvidenceWriteSerializer(data=request.data)
		write_serializer.is_valid(raise_exception=True)

		# if DeliveryEvidence.objects.filter(order=order).exists():
		# 	return Response(
		# 		{'detail': 'Este pedido ya tiene documento cargado.'},
		# 		status=status.HTTP_409_CONFLICT,
		# 	)

		evidence = DeliveryEvidence.objects.create(
			order=order,
			public_id=write_serializer.validated_data['public_id'],
			extension=write_serializer.validated_data['extension'],
			bytes=write_serializer.validated_data['bytes'],
			uploaded_by=request.user,
			evidence_type=write_serializer.validated_data['evidence_type'],
		)
		return Response(
			DeliveryEvidenceSerializer(evidence, context={'request': request}).data,
			status=status.HTTP_201_CREATED,
		)


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
