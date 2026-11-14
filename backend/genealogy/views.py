from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import UserMeSerializer

class UserMeView(APIView):
    # Bắt buộc phải có token JWT mới được vào API này
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user đã được giải mã tự động từ access_token
        serializer = UserMeSerializer(request.user)
        return Response(serializer.data)