export const workshopSources = {
  ilo: 'https://www.ilo.org/resource/article/when-ai-meets-decent-work-productivity-breakthrough-factory-floor',
  policy: 'https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-ve-dot-pha-phat-trien-khoa-hoc-cong-nghe-doi-moi-sang-tao-va-chuyen-doi-so-quoc-gia-119241224180048642.htm',
}

export const workshopActs = [
  {
    label: 'Tổ chức — quản lý', short: 'Ai làm?',
    title: 'AI báo lỗi.\nAi được dừng máy?',
    intro: 'AI vừa phát hiện một chi tiết lỗi. Nếu công nhân chỉ được làm như cũ, ai sẽ dừng máy và xử lý?',
    prompt: 'Đổi cách giao việc. Nhìn dây chuyền bên phải.',
    choices: ['Làm như cũ', 'Học cách kiểm tra lỗi', 'Học + được quyền dừng máy'],
    results: [
      {title:'AI thấy lỗi. Máy vẫn chạy.',body:'Người đứng máy chưa được giao việc kiểm tra và quyền xử lý cảnh báo. Đổi máy mà giữ nguyên cách giao việc thì vấn đề vẫn còn.',nodes:['Máy làm chi tiết','AI phát hiện lỗi','Chưa ai được xử lý']},
      {title:'Biết kiểm tra, nhưng còn chờ lệnh.',body:'Người đã biết đọc cảnh báo, nhưng vẫn phải chờ người có thẩm quyền. Đào tạo cần đi cùng phân công và quyền xử lý.',nodes:['Máy vẫn chạy','Người hiểu cảnh báo','Còn chờ quyết định']},
      {title:'Dừng dây chuyền để kiểm tra lỗi.',body:'Người đã được đào tạo có quyền dừng máy theo quy trình. Xưởng quy định rõ ai kiểm tra, ai sửa và ai chịu trách nhiệm.',nodes:['Dây chuyền dừng','Kiểm tra chi tiết lỗi','Người chịu trách nhiệm']},
    ],
    takeaway:'Tổ chức — quản lý là cách giao việc, phối hợp và trao quyền quyết định cho con người.',
  },
  {
    label:'Sở hữu', short:'Máy của ai?',
    title:'Chiếc máy này\nthuộc về ai?',
    intro:'Cùng một chiếc máy, xưởng có thể mua, thuê hoặc cùng đối tác góp tiền. Mỗi cách đặt ra quyền quyết định khác nhau.',
    prompt:'Chọn một cách để có máy trong xưởng.',
    choices:['Xưởng mua máy','Xưởng thuê máy','Hai bên góp vốn'],
    results:[
      {title:'Máy của xưởng, xưởng tự quyết định.',nodes:['Xưởng sở hữu','Xưởng quyết định','Xưởng chịu bảo trì']},
      {title:'Xưởng được dùng máy, máy vẫn của bên cho thuê.',nodes:['Bên cho thuê sở hữu','Xưởng được sử dụng','Quyền theo hợp đồng']},
      {title:'Cùng góp tiền, cùng thỏa thuận quyền.',nodes:['Máy góp vốn chung','Các bên cùng quản lý','Quyền theo thỏa thuận']},
    ],
    takeaway:'Sở hữu: máy, công cụ và nguyên liệu để sản xuất thuộc về ai. Được dùng máy chưa chắc đã sở hữu máy.',
  },
  {
    label:'Phân phối', short:'Ai hưởng?',
    title:'Máy làm nhanh hơn.\nAi được hưởng?',
    intro:'Xưởng bán sản phẩm để trả chi phí và tiền công. Phần lợi nhuận còn lại có thể chia cho người góp vốn hoặc giữ lại phát triển xưởng.',
    prompt:'Theo sợi đỏ: thành quả đến với ai?',
    choices:['Người lao động','Người góp vốn','Phát triển xưởng'],
    results:[
      {title:'Người làm việc nhận tiền công và thưởng.',nodes:['Người lao động','Người góp vốn','Phát triển xưởng']},
      {title:'Người góp vốn nhận phần lợi nhuận được chia.',nodes:['Người lao động','Người góp vốn','Phát triển xưởng']},
      {title:'Giữ lại một phần để xưởng phát triển tiếp.',nodes:['Người lao động','Người góp vốn','Phát triển xưởng']},
    ],
    takeaway:'Phân phối là cách chia thành quả. Năng suất tăng không tự quyết định ai được hưởng bao nhiêu.',
  },
] as const
