from django.db import connection

def get_ancestor_path(member_id):
    """
    Sử dụng WITH RECURSIVE để truy vết ngược từ member_id lên tận Thủy tổ.
    Trả về mảng tổ tiên (độ sâu depth tăng dần: 0 là bản thân, 1 là cha, 2 là ông...).
    """
    query = """
        WITH RECURSIVE Ancestors AS (
            SELECT id, father_id, generation, birth_order, gender, 0 AS depth
            FROM members
            WHERE id = %s
            
            UNION ALL
            
            SELECT m.id, m.father_id, m.generation, m.birth_order, m.gender, a.depth + 1
            FROM members m
            INNER JOIN Ancestors a ON m.id = a.father_id
        )
        SELECT id, father_id, generation, birth_order, gender, depth 
        FROM Ancestors 
        ORDER BY depth ASC;
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [member_id])
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

def calculate_relationship(person_a_id, person_b_id):
    """
    Thuật toán tìm LCA và suy luận cách A gọi B.
    """
    if person_a_id == person_b_id:
        return "Bản thân"

    path_a = get_ancestor_path(person_a_id)
    path_b = get_ancestor_path(person_b_id)

    if not path_a or not path_b:
        return "Không xác định"

    # Tìm Tổ tiên chung gần nhất (LCA)
    lca = None
    path_b_dict = {node['id']: node for node in path_b}
    
    for node_a in path_a:
        if node_a['id'] in path_b_dict:
            lca = node_a
            break

    if not lca:
        return "Không cùng huyết thống (Khác họ/nhánh)"

    node_b_in_lca = path_b_dict[lca['id']]
    dist_a = node_a['depth']
    dist_b = node_b_in_lca['depth']
    gender_b = path_b[0]['gender']
    
    # 1. B là Tổ tiên trực hệ của A
    if dist_b == 0:
        if dist_a == 1: return "Cha" if gender_b == 'MALE' else "Mẹ"
        if dist_a == 2: return "Ông" if gender_b == 'MALE' else "Bà"
        if dist_a == 3: return "Cụ" if gender_b == 'MALE' else "Cụ bà"
        return f"Tổ tiên (trên {dist_a} đời)"
        
    # 2. B là Hậu duệ trực hệ của A
    if dist_a == 0:
        if dist_b == 1: return "Con trai" if gender_b == 'MALE' else "Con gái"
        if dist_b == 2: return "Cháu nội"
        return f"Cháu chắt (dưới {dist_b} đời)"
        
    # 3. Quan hệ họ hàng: Xác định thứ bậc nhánh qua người con của LCA
    # Người con của LCA hướng về nhánh A và nhánh B
    order_branch_a = path_a[dist_a - 1]['birth_order'] or 99
    order_branch_b = path_b[dist_b - 1]['birth_order'] or 99
    is_b_senior_branch = order_branch_b < order_branch_a # Nhánh của B lớn hơn nhánh của A
    
    # Cùng đời
    if dist_a == dist_b:
        if dist_a == 1: # Anh chị em ruột
            if is_b_senior_branch:
                return "Anh" if gender_b == 'MALE' else "Chị"
            else:
                return "Em trai" if gender_b == 'MALE' else "Em gái"
        else: # Anh chị em họ
            if is_b_senior_branch:
                return "Anh họ" if gender_b == 'MALE' else "Chị họ"
            else:
                return "Em họ"
                
    # B ở đời cao hơn A (Bậc cha chú)
    elif dist_a > dist_b:
        diff = dist_a - dist_b
        if diff == 1:
            if gender_b == 'MALE':
                return "Bác" if is_b_senior_branch else "Chú"
            else:
                return "Bác gái" if is_b_senior_branch else "Cô"
        elif diff == 2:
            return "Ông trẻ" if gender_b == 'MALE' else "Bà trẻ"
        return f"Bậc cha chú (cách {diff} đời)"
        
    # B ở đời thấp hơn A (Bậc con cháu)
    else: 
        return "Cháu họ"