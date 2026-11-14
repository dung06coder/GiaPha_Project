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
        return request.method in SAFE_METHODS