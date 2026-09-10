import assert from 'node:assert/strict';
import { DOWNSTAIRS, BEDROOM, isWalkable } from '../src/data/maps.js';
import { trailTravelPixels } from '../src/data/trailTravel.js';
import { environmentCell } from '../src/data/environmentArt.js';
for (const [map, start] of [[DOWNSTAIRS,[7,13]],[BEDROOM,[9,10]]]) {
 const seen=new Set([start.join(',')]), queue=[start];
 while(queue.length) {
  const [x,y]=queue.shift();
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
   const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;
   if(nx<0||ny<0||nx>=map.cols||ny>=map.rows||seen.has(key)||!isWalkable(map,nx,ny))continue;
   seen.add(key);queue.push([nx,ny]);
  }
 }
 map.grid.forEach((row,y)=>[...row].forEach((code,x)=>{
  // The head and foot of the two-cell bed are one sleep interaction.
  if(map.interactions[code] && code !== 'e') assert([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen.has(`${x+dx},${y+dy}`)),`Unreachable ${code} at ${x},${y}`);
  if(code==='s'||code==='D')assert(seen.has(`${x},${y}`),`Blocked exit ${code}`);
 }));
 console.log(`All furniture interactions and exits reachable: ${map.cols}x${map.rows}`);
}
assert.equal(trailTravelPixels(0),0);
assert.equal(trailTravelPixels(-1),0);
assert.equal(trailTravelPixels(NaN),0);
assert(trailTravelPixels(.02)>trailTravelPixels(.01));
assert.equal(environmentCell('rill'),4);
assert.equal(environmentCell('gale'),2);
assert.equal(environmentCell('ember'),8);
console.log('Distance-based scenery and primary region mappings passed');
