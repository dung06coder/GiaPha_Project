from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Branch, Member, Marriage, Event, User


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'founder')
    search_fields = ('name',)


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'gender', 'generation', 'branch', 'father', 'mother', 'is_alive')
    list_filter = ('generation', 'gender', 'is_alive', 'branch')
    search_fields = ('full_name', 'alias_name')


@admin.register(Marriage)
class MarriageAdmin(admin.ModelAdmin):
    list_display = ('id', 'husband', 'wife', 'marriage_order', 'status')
    list_filter = ('status', 'marriage_order')


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'event_type', 'lunar_day', 'lunar_month', 'solar_date', 'related_member')
    list_filter = ('event_type',)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Phân quyền Gia Phả', {'fields': ('role', 'linked_member', 'managed_branch')}),
    )
    list_display = ('username', 'email', 'role', 'linked_member', 'managed_branch', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')      