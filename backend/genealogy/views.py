from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Branch, Member, Marriage
from .serializers import UserMeSerializer, BranchSerializer, MemberSerializer, MarriageSerializer
from .permissions import IsAdminOrEditorForEdit
class UserMeView(APIView):
    # Bắt buộc phải có token JWT mới được vào API này
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user đã được giải mã tự động từ access_token
        serializer = UserMeSerializer(request.user)
        return Response(serializer.data)
    
class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAdminOrEditorForEdit]

class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    permission_classes = [IsAdminOrEditorForEdit]

class MarriageViewSet(viewsets.ModelViewSet):
    queryset = Marriage.objects.all()
    serializer_class = MarriageSerializer
    permission_classes = [IsAdminOrEditorForEdit]