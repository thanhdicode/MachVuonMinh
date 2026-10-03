import { historyEras } from './history'
// Sources stay in the secondary drawer. Checked 2026-10-02.
const records=[
  {
    "source": "Khái quát sản xuất thủ công",
    "agency": "Brief biên tập; hiện vật nông nghiệp và thủ công",
    "year": "Trước 1858",
    "location": "Diễn giải khái quát, không có thống kê. Minh họa tổng hợp, không tái dựng một làng cụ thể.",
    "url": "https://baotanglichsu.vn/vi"
  },
  {
    "source": "Giao thông vận tải Việt Nam — nghiên cứu tình huống",
    "agency": "Chương trình Giảng dạy Kinh tế Fulbright",
    "year": "1936",
    "location": "Lịch sử đường sắt: Hà Nội – Sài Gòn, 1.726 km, hoàn thành năm 1936.",
    "url": "https://fsppm.fulbright.edu.vn/cache-cp/CaseProgram60-l.pdf"
  },
  {
    "source": "Giai đoạn 1945–1954",
    "agency": "Bộ Công Thương",
    "year": "1945–1954",
    "location": "I.1.1: di chuyển máy móc/xưởng dệt, giấy, in; các mỏ than dùng phương pháp thủ công.",
    "url": "https://moit.gov.vn/gioi-thieu/cac-thoi-ky-phat-trien/giai-doan-1945-19542.html"
  },
  {
    "source": "Giai đoạn 1955–1965 và 1955–1975",
    "agency": "Bộ Công Thương",
    "year": "1955–1975",
    "location": "Khôi phục và xây dựng công nghiệp miền Bắc: cơ khí, điện, hóa chất, vật liệu. Đất nước còn chia cắt.",
    "url": "https://moit.gov.vn/gioi-thieu/cac-thoi-ky-phat-trien/giai-doan-1955-19652.html"
  },
  {
    "source": "Giai đoạn 1975–1985",
    "agency": "Bộ Công Thương",
    "year": "1976; 1981–1985",
    "location": "1.279 xí nghiệp miền Bắc + 634 miền Nam = 1.913, thuộc quốc doanh/công tư hợp doanh. Công nghiệp 1981–1985 tăng bình quân 9,5%/năm.",
    "url": "https://moit.gov.vn/gioi-thieu/cac-thoi-ky-phat-trien/giai-doan-1975-1985.html"
  },
  {
    "source": "Giai đoạn 1986–2006",
    "agency": "Bộ Công Thương",
    "year": "2005 so với 1986",
    "location": "Xuất khẩu 2005 khoảng 32,442 tỷ USD, gần 40 lần 1986; trình bày làm tròn 32,4 tỷ USD.",
    "url": "https://moit.gov.vn/gioi-thieu/cac-thoi-ky-phat-trien/giai-doan-1986-2006.html"
  },
  {
    "source": "Viet Nam — country overview",
    "agency": "Ngân hàng Thế giới",
    "year": "1993 → 2019",
    "location": "Đến 2019 gần như mọi hộ gia đình có điện, từ 14% năm 1993. Đây là tỷ lệ hộ gia đình.",
    "url": "https://www.worldbank.org/ext/en/country/vietnam"
  },
  {
    "source": "Individuals using the Internet (% of population)",
    "agency": "Ngân hàng Thế giới / ITU",
    "year": "2024",
    "location": "IT.NET.USER.ZS: 84% (làm tròn trên trang quốc gia). Phân kỳ 1997–2026 không phải dự báo thống kê 2026.",
    "url": "https://data.worldbank.org/indicator/IT.NET.USER.ZS?locations=VN"
  }
]
export const historySources=records.map((record,i)=>({...record,code:`H${String(i+1).padStart(2,'0')}`,topic:historyEras[i].title,text:historyEras[i].body.join(' '),mapping:'Quan sát sự biến đổi của công cụ, hạ tầng và năng lực người lao động; không coi các mốc là những phương thức sản xuất. Hình ảnh là minh họa tái dựng bằng imagegen, không phải ảnh tư liệu lịch sử.'}))
export const historyAdditionalSources=[
  {
    "source": "Công thương nghiệp miền Nam 1955–1975",
    "url": "https://moit.gov.vn/gioi-thieu/cac-thoi-ky-phat-trien/giai-doan-1955-1975.html"
  },
  {
    "source": "Internet Việt Nam đã có những bước tiến ấn tượng",
    "location": "Bộ TT&TT (cổng hiện nay Bộ KH&CN): lễ mở cửa Internet 19.11.1997.",
    "url": "https://mst.gov.vn/internet-viet-nam-da-co-nhung-buoc-tien-an-tuong-197136077.htm"
  },
  {
    "source": "Nghị quyết 57-NQ/TW",
    "location": "22.12.2024; cơ sở diễn giải khoa học, công nghệ và chuyển đổi số.",
    "url": "https://baochinhphu.vn/nghi-quyet-so-57-tu-tam-nhin-den-hanh-dong-de-tang-toc-trong-ky-nguyen-so-102241227194540796.htm"
  }
]
