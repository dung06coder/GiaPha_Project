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
    queryset = Branch.objects.select_related('founder').all().order_by('id')
    serializer_class = BranchSerializer
    permission_classes = [IsAdminOrEditorForEdit]

class MemberViewSet(viewsets.ModelViewSet):
    queryset = (Member.objects.select_related('branch','father','mother')
                .all().order_by('generation','birth_order','id'))
    serializer_class = MemberSerializer
    permission_classes = [IsAdminOrEditorForEdit]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        branch_id = self.request.query_params.get('branch')
        generation = self.request.query_params.get('generation')
        is_alive = self.request.query_params.get('is_alive')
        
        if branch_id:
            queryset = queryset.filter(branch_id= branch_id)
        if generation:
            queryset = queryset.filter(generation = generation)
        if is_alive is not None:
            if is_alive.lower() in ['true','1']:
                queryset = queryset.filter(is_alive = True)
            elif is_alive.lower() in ['false','0']:
                queryset = queryset.filter(is_alive= False)
        return queryset

class MarriageViewSet(viewsets.ModelViewSet):
    queryset = (Marriage.objects.select_related('husband', 'wife')
        .all()
        .order_by('husband_id', 'marriage_order')
    )
    serializer_class = MarriageSerializer
    permission_classes = [IsAdminOrEditorForEdit]