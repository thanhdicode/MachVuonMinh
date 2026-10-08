import test from 'node:test'
import assert from 'node:assert/strict'
import {handLayout,storyExtent,finaleScrollProgress,finaleScrollPosition,HAND_ASSETS} from '../src/experience/handFinaleGeometry.ts'
import {flowJourneyPosition} from '../src/experience/scene07State.ts'

test('both real-image fingertip anchors meet the same contact point on every screen',()=>{
 for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,768],[768,1024],[390,844],[320,568]]){
  const layout=handLayout(width,height)
  for(const [name,hand] of Object.entries(layout.hands)){
   const tip=HAND_ASSETS[name].tip
   assert.ok(Math.abs(hand.x+hand.width*tip[0]-layout.contact.x)<1e-8,`${name} x at ${width}`)
   assert.ok(Math.abs(hand.y+hand.height*tip[1]-layout.contact.y)<1e-8,`${name} y at ${height}`)
   // Transparent padding may leave the viewport; all curled fingers remain inside the image.
   assert.ok(hand.y>=0&&hand.y+hand.height*.85<height,`${name} hand fits ${width}x${height}`)
  }
 }
})

test('an appended finale cannot alter any previous chapter navigation position',()=>{
 const oldHeight=33000,viewport=900,finaleHeight=3600,insertions=17000
 const before=storyExtent(oldHeight,viewport,0),after=storyExtent(oldHeight+finaleHeight,viewport,finaleHeight)
 assert.equal(after,before)
 const range=base=>({base:(base-insertions)/.78,atlasStart:2340,atlasLength:8000,machineStart:10340,machineLength:4000,flowStart:21100,flowLength:5000})
 for(const progress of [.03,.12,.21,.32,.42,.54,.71,.84,.96])assert.equal(flowJourneyPosition(progress,range(before)),flowJourneyPosition(progress,range(after)))
})

test('finale resize and reduced-motion relayout preserve local scroll rather than returning to synthesis',()=>{
 assert.equal(finaleScrollProgress(9000,10000,3000,900),0)
 assert.equal(finaleScrollProgress(12100,10000,3000,900),1)
 const progress=finaleScrollProgress(11050,10000,3000,900)
 assert.equal(progress,.5)
 assert.equal(finaleScrollPosition(progress,12000,2400,800),12800)
 assert.equal(finaleScrollPosition(progress,12000,400,800),12000)
 assert.equal(storyExtent(0,900,0),0)
})
