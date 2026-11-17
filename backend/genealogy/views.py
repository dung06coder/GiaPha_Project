import datetime

from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework.decorators import action
from lunarcalendar import Lunar, Converter, DateNotExist

from .utils import calculate_relationship
from .models import Branch, Member, Marriage,Event
from .serializers import UserMeSerializer, BranchSerializer, MemberSerializer, MarriageSerializer,EventSerializer
from .permissions import IsAdminOrEditorForEdit,ReadOnlyOrHideAliveData
from django.db import connection

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
    
class TreeView(APIView):
    # Cấp quyền cho tất cả mọi người vào xem (Guest sẽ bị ẩn thông tin nhạy cảm ở cấp Frontend/Serializer)
    permission_classes = [ReadOnlyOrHideAliveData]

    def get(self, request):
        # 1. Câu truy vấn đệ quy lấy toàn bộ phả hệ bắt đầu từ Thủy tổ (người không có cha mẹ)
        query = """
            WITH RECURSIVE FamilyTree AS (
                -- Khởi tạo: Lấy các Thủy tổ (Đời 1)
                SELECT id, full_name, alias_name, gender, generation, 
                       branch_id, father_id, mother_id, is_alive
                FROM members
                WHERE father_id IS NULL AND mother_id IS NULL
                
                UNION DISTINCT
                
                -- Đệ quy: Lấy con cái của những người đã nằm trong FamilyTree
                SELECT m.id, m.full_name, m.alias_name, m.gender, m.generation, 
                       m.branch_id, m.father_id, m.mother_id, m.is_alive
                FROM members m
                INNER JOIN FamilyTree ft ON m.father_id = ft.id OR m.mother_id = ft.id
            )
            SELECT * FROM FamilyTree ORDER BY generation ASC, id ASC;
        """
        
        with connection.cursor() as cursor:
            cursor.execute(query)
            columns = [col[0] for col in cursor.description]
            # Biến đổi dữ liệu thô thành mảng Dictionary Python
            members = [dict(zip(columns, row)) for row in cursor.fetchall()]

        nodes = []
        edges = []
        member_ids = []

        # 2. Biến đổi dữ liệu thành mảng Nodes và Edges cho React Flow
        for member in members:
            member_ids.append(member['id'])
            
            # Tạo Node (Đỉnh đại diện cho 1 thành viên)
            nodes.append({
                "id": str(member['id']),
                "type": "customMemberNode", # Tên component sẽ tự build ở Giai đoạn 3
                "position": {"x": 0, "y": 0}, # Dagre ở Frontend sẽ tự động tính lại tọa độ
                "data": {
                    "full_name": member['full_name'],
                    "gender": member['gender'],
                    "generation": member['generation'],
                    "is_alive": member['is_alive'],
                    "branch_id": member['branch_id']
                }
            })
            
            # Tạo Edge Huyết thống (Đường nối Cha -> Con)
            if member['father_id']:
                edges.append({
                    "id": f"edge-f{member['father_id']}-c{member['id']}",
                    "source": str(member['father_id']),
                    "target": str(member['id']),
                    "type": "smoothstep", # Nét gấp khúc
                    "animated": True,
                    "style": {"stroke": "#78716C", "strokeWidth": 2}
                })
                
            # Tạo Edge Huyết thống (Đường nối Mẹ -> Con)
            if member['mother_id']:
                edges.append({
                    "id": f"edge-m{member['mother_id']}-c{member['id']}",
                    "source": str(member['mother_id']),
                    "target": str(member['id']),
                    "type": "smoothstep",
                    "animated": True,
                    "style": {"stroke": "#78716C", "strokeWidth": 2}
                })

        # 3. Quét bảng Marriages để tạo Edge Hôn nhân (Vợ - Chồng)
        if member_ids:
            marriages = Marriage.objects.filter(husband_id__in=member_ids, wife_id__in=member_ids)
            for marriage in marriages:
                edges.append({
                    "id": f"edge-h{marriage.husband_id}-w{marriage.wife_id}",
                    "source": str(marriage.husband_id),
                    "target": str(marriage.wife_id),
                    "type": "straight", # Nét thẳng ngang
                    "style": {"strokeDasharray": "5,5", "stroke": "#BE123C", "strokeWidth": 2}
                })

        return Response({
            "nodes": nodes,
            "edges": edges
        })
        
class RelationshipView(APIView):
    permission_classes = [AllowAny] # Mở cho mọi người kiểm tra xưng hô

    def get(self, request):
        person_a_id = request.query_params.get('person_a')
        person_b_id = request.query_params.get('person_b')

        if not person_a_id or not person_b_id:
            return Response({"error": "Thiếu tham số person_a hoặc person_b"}, status=400)

        try:
            member_a = Member.objects.get(id=person_a_id)
            member_b = Member.objects.get(id=person_b_id)
        except Member.DoesNotExist:
            return Response({"error": "Không tìm thấy thành viên trong cơ sở dữ liệu"}, status=404)

        # Tính toán A gọi B là gì
        term_a_calls_b = calculate_relationship(person_a_id, person_b_id)
        # Tính toán B gọi A là gì
        term_b_calls_a = calculate_relationship(person_b_id, person_a_id)

        return Response({
            "person_a": member_a.full_name,
            "person_b": member_b.full_name,
            "lca_logic": {
                "person_a_calls_b": term_a_calls_b,
                "person_b_calls_a": term_b_calls_a,
                "message": f"Theo vai vế, {member_a.full_name} gọi {member_b.full_name} là {term_a_calls_b}."
            }
        })

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAdminOrEditorForEdit]

    @action(detail=False, methods=['get'], url_path='upcoming-anniversaries', permission_classes=[IsAuthenticated])
    def upcoming_anniversaries(self, request):
        today = datetime.date.today()
        current_year = today.year
        
        # 1. Quét các thành viên đã mất có lưu ngày tháng mất Âm lịch
        deceased_members = Member.objects.filter(
            is_alive=False, 
            death_date_lunar_day__isnull=False, 
            death_date_lunar_month__isnull=False
        )
        
        upcoming_list = []
        for member in deceased_members:
            try:
                # 2. Quy đổi ngày giỗ Âm lịch sang Dương lịch của năm nay
                lunar_date = Lunar(current_year, member.death_date_lunar_month, member.death_date_lunar_day, isleap=False)
                solar_date = Converter.Lunar2Solar(lunar_date).to_date()
                
                # 3. Nếu ngày giỗ năm nay đã qua, tính ngày giỗ cho năm sau
                if solar_date < today:
                    lunar_date_next = Lunar(current_year + 1, member.death_date_lunar_month, member.death_date_lunar_day, isleap=False)
                    solar_date = Converter.Lunar2Solar(lunar_date_next).to_date()
                    
                days_left = (solar_date - today).days
                
                upcoming_list.append({
                    "member_id": member.id,
                    "full_name": member.full_name,
                    "lunar_death_date": f"{member.death_date_lunar_day:02d}/{member.death_date_lunar_month:02d}",
                    "solar_anniversary_date": solar_date.strftime("%Y-%m-%d"),
                    "days_left": days_left,
                    "generation": member.generation
                })
            except DateNotExist:
                # Bỏ qua nếu dữ liệu Âm lịch không hợp lệ (VD: ngày 30 tháng 2 Âm)
                continue 
        
        # 4. Sắp xếp danh sách ưu tiên ngày giỗ gần nhất
        upcoming_list.sort(key=lambda x: x['days_left'])
        
        # Trả về 10 đám giỗ sắp tới
        return Response({
            "message": "Danh sách lịch giỗ sắp tới",
            "data": upcoming_list[:10]
        })