export const vietnamCases = [
  {
    name:'Cánh đồng',title:'Cùng cánh đồng.\nCách làm mới.',place:'HTX THÂM TRIỀU · QUẢNG TRỊ',
    fact:'28,4',unit:'ha lúa',context:'Vụ Đông Xuân 2025–2026',
    observation:'HTX liên kết dịch vụ drone để chăm sóc lúa.',
    sourceIndex:4,coordinate:[107.2,16.75],
    responses:['Tiếp cận máy qua liên kết dịch vụ.','HTX phối hợp lịch và người vận hành.','Minh bạch chi phí, lợi ích của xã viên.'],
  },
  {
    name:'Nhà máy',title:'Máy kết nối.\nNgười phối hợp.',place:'VINFAST · HẢI PHÒNG',
    fact:'1.200',unit:'robot',context:'Theo công bố VinFast · 07.03.2019',
    observation:'Robot, băng chuyền và hệ quản lý MES nối sản xuất.',
    sourceIndex:5,coordinate:[106.9,20.8],
    responses:['Tạo điều kiện làm chủ công cụ, tri thức.','Đào tạo lại, phối hợp người và hệ thống.','Gắn đãi ngộ với đóng góp và kỹ năng.'],
  },
  {
    name:'Kinh tế số',title:'Giá trị mới.\nAi cùng hưởng?',place:'VIỆT NAM · KINH TẾ SỐ',
    fact:'13,17%',unit:'GDP năm 2024',context:'Tỷ trọng giá trị tăng thêm · ước tính',
    observation:'Kinh tế số gồm ngành số lõi và ngành được số hóa.',
    sourceIndex:6,coordinate:null,
    responses:['Làm rõ quyền với dữ liệu, tư liệu số.','Kết nối dữ liệu đi cùng trách nhiệm.','Mở cơ hội tham gia, chia sẻ thành quả.'],
  },
] as const

export const relationQuestions = [
  {name:'SỞ HỮU',question:'Ai sở hữu?'},
  {name:'TỔ CHỨC',question:'Ai phối hợp?'},
  {name:'PHÂN PHỐI',question:'Ai hưởng lợi?'},
] as const
