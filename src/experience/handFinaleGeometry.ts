export const HAND_ASSETS = {
  human: {src:'/images/finale/human-hand.webp',width:1680,height:840,tip:[1409/1774,423.5/887] as const},
  robot: {src:'/images/finale/robot-hand.webp',width:1680,height:700,tip:[152/1942,281/809] as const},
}
export function handLayout(width:number,height:number){
  const contact={x:width*.5,y:height*.46},imageWidth=width*(width<768?.96:.72)
  const place=(asset:typeof HAND_ASSETS.human|typeof HAND_ASSETS.robot)=>{
    const imageHeight=imageWidth*asset.height/asset.width
    return {width:imageWidth,height:imageHeight,x:contact.x-imageWidth*asset.tip[0],y:contact.y-imageHeight*asset.tip[1]}
  }
  return {contact,hands:{human:place(HAND_ASSETS.human),robot:place(HAND_ASSETS.robot)}}
}
export const storyExtent=(documentHeight:number,viewportHeight:number,appendixHeight:number)=>Math.max(0,documentHeight-viewportHeight-appendixHeight)
export const finaleScrollProgress=(y:number,start:number,height:number,viewport:number)=>Math.max(0,Math.min(1,(y-start)/Math.max(1,height-viewport)))
export const finaleScrollPosition=(progress:number,start:number,height:number,viewport:number)=>start+Math.max(0,Math.min(1,progress))*Math.max(0,height-viewport)
