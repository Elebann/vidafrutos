from django.urls import reverse
from rest_framework.test import APITestCase
from accounts.models import User, Rol

class InventoryAPITest(APITestCase):
    def setUp(self):
        self.rol = Rol.objects.create(name='Test')
        self.user = User.objects.create_user(username='testuser', password='testpass', rut='22.222.222-2', rol=self.rol)
        self.client.force_authenticate(user=self.user)

    def test_list_movements(self):
        url = reverse('rawstockmovement-list')
        response = self.client.get(url)
        self.assertIn(response.status_code, (200, 204))
