export function labState(forces: number[], relations: number[]) {
  const mean = (values: number[]) => values.reduce((sum, n) => sum + Math.max(0, Math.min(100, n)), 0) / (values.length || 1) / 100
  const force = mean(forces), relation = mean(relations), gap = force - relation
  return { force, relation, gap, alignment: 1 - Math.abs(gap), state: Math.abs(gap) >= .38 ? 'contradiction' : Math.abs(gap) >= .18 ? 'strain' : 'fit' }
}
export function installToken(slots: (number | null)[], token: number, slot: number) {
  if (!Number.isInteger(token) || token < 0 || token > 6 || !Number.isInteger(slot) || slot < 0 || slot > 2) return slots
  return slots.map((value, index) => index === slot ? token : value === token ? null : value)
}
export const tokens = ['Kỹ năng số', 'Quyền dữ liệu', 'Quản trị dữ liệu', 'Sandbox', 'Đãi ngộ sáng tạo', 'Hạ tầng số', 'Tiếp cận bao trùm']
export function policyResult(selected: (number | null)[]) {
  const has = (n: number) => selected.includes(n)
  const strengths = [has(0) && 'năng lực con người', (has(1) || has(2)) && 'trách nhiệm với dữ liệu', has(3) && 'thử nghiệm có kiểm soát', has(4) && 'động lực sáng tạo', has(5) && 'nền tảng kết nối', has(6) && 'cơ hội tiếp cận'].filter(Boolean)
  const missing = !has(5) ? 'Hạ tầng chưa được ưu tiên.' : !has(6) ? 'Cơ hội tiếp cận chưa được ưu tiên.' : !has(0) ? 'Kỹ năng làm chủ công nghệ còn thiếu.' : 'Quyền và trách nhiệm dữ liệu cần được bổ sung.'
  const tradeoff = has(3) ? 'Thử nghiệm nhanh cần giới hạn rủi ro và cơ chế giám sát.' : has(1) || has(2) ? 'Bảo vệ dữ liệu cần cân bằng với chia sẻ và khai thác.' : has(5) ? 'Đầu tư hạ tầng cần nguồn lực dài hạn và năng lực vận hành.' : 'Đầu tư con người cần thời gian để tạo chuyển biến.'
  return { strength: strengths.join(', '), missing, tradeoff }
}
