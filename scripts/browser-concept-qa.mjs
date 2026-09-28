import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'

export async function verifyConcept({tab,viewport,out}) {
  const button=name=>tab.playwright.getByRole('button',{name,exact:true})
  const pause=()=>new Promise(r=>setTimeout(r,700))
  await viewport.set({width:1440,height:900})
  await button('Mở mục lục').press('Enter')
  await button('06 Việt Nam ↗').press('Enter');await pause()
  const facts=['28,4','1.200','13,17%'],codes=['E','F','G']
  const cases=['01 Cánh đồng','02 Nhà máy','03 Kinh tế số']
  const lenses=['SỞ HỮU Ai sở hữu?','TỔ CHỨC Ai phối hợp?','PHÂN PHỐI Ai hưởng lợi?']
  for(let i=0;i<cases.length;i++){
    await button(cases[i]).press('Enter');await pause()
    assert.equal(await button(cases[i]).getAttribute('aria-pressed'),'true')
    assert.ok(await tab.playwright.getByText(facts[i],{exact:true}).isVisible())
    for(const lens of lenses){await button(lens).press('Space');assert.equal(await button(lens).getAttribute('aria-pressed'),'true')}
    await button(`[${codes[i]}] Dữ kiện & nguồn gốc ↗`).press('Enter')
    const link=tab.playwright.getByRole('link',{name:'ĐỌC NGUỒN GỐC ↗',exact:true})
    assert.match(await link.getAttribute('href'),/^https:\/\//)
    await button('Đóng bảng').press('Escape');await pause()
    assert.equal(await tab.playwright.getByRole('dialog').count(),0)
  }
  await viewport.set({width:390,height:844});await pause()
  for(const name of cases){
    await button(name).press('Enter')
    const bounds=await tab.playwright.getByRole('region',{name:'Việt Nam và những bằng chứng',exact:true}).evaluate(el=>{
      const r=s=>el.querySelector(s).getBoundingClientRect()
      return {heading:r('.vietnam-copy').bottom,fact:r('.case-fact').top,response:r('.relation-bridge').bottom,nav:r('.case-navigation').top,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth}
    })
    assert.ok(bounds.heading+6<bounds.fact,'Mobile title and statistic are separated')
    assert.ok(bounds.response+8<bounds.nav,'Response remains above case navigation')
    assert.equal(bounds.overflow,false,'No horizontal overflow')
  }
  await button('Phóng to bản đồ ↗').press('Enter');await pause()
  assert.ok(await button('Đóng bản đồ').isVisible())
  assert.ok(await tab.playwright.getByRole('dialog').getByText('Quần đảo Hoàng Sa',{exact:true}).isVisible())
  assert.ok(await tab.playwright.getByRole('dialog').getByText('Quần đảo Trường Sa',{exact:true}).isVisible())
  await button('Đóng bản đồ').press('Escape');await pause()
  assert.equal(await tab.playwright.getByRole('dialog').count(),0)
  const restored=await button('Phóng to bản đồ ↗').evaluate(el=>document.activeElement===el&&!document.body.classList.contains('drawer-open'))
  assert.ok(restored,'Map restores focus and releases the scroll lock')
  const errors=await tab.dev.logs({levels:['error'],limit:50})
  assert.equal(errors.length,0,JSON.stringify(errors))
  const report={cases:3,relationChoices:9,sourceDrawers:3,mobileNoOverlap:true,mapKeyboardAndFocus:true,errors}
  await writeFile(`${out}/concept-report.json`,JSON.stringify(report,null,2))
  return report
}
