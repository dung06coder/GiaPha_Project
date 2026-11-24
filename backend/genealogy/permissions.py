from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class IsEditorUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'EDITOR'])

class IsMemberUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

class ReadOnlyOrHideAliveData(BasePermission):
    """
    Cho phép đọc công khai (GET), nhưng Guest không được thấy thông tin chi tiết.
    (Logic ẩn dữ liệu sẽ được kết hợp xử lý trong file serializers.py ở Task 2.2)
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True;
        return bool(request.user and request.user.is_authenticated)
    
class IsAdminOrEditorForEdit(BasePermission):
    """
    Quyền truy cập API CRUD:
    - GET (Read): Ai cũng được đọc (Guest, Member, Editor, Admin).
    - POST, PUT, PATCH, DELETE: Chỉ Admin và Editor mới có quyền.
      * Admin: Toàn quyền.
      * Editor: Chỉ sửa được dữ liệu thuộc Chi/Phái mình quản lý.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.role in ['ADMIN', 'EDITOR'])
    )

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
            
        if request.user.role == 'ADMIN':
            return True
            
        if request.user.role == 'EDITOR':
            # Lấy Chi phái mà Editor này đang được giao quản lý
            managed_branch = request.user.managed_branch_id
            if not managed_branch:
                return False
                
            # Kiểm tra xem dữ liệu đang bị sửa thuộc về Chi phái nào
            model_name = obj.__class__.__name__
            if model_name == 'Branch':
                return obj.id == managed_branch
            elif model_name == 'Member':
                return obj.branch_id == managed_branch
            elif model_name == 'Marriage':
                return obj.husband.branch_id == managed_branch
                
        return False
    
