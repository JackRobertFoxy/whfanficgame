import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshPuzzles,puzzleAnswer,poweredTiles} from './puzzles';
test('cogitator requires an actually connected path between both terminals',()=>{
 const p=freshPuzzles().cogitator;assert.equal(puzzleAnswer('cogitator',p).ok,false);
 for(const i of [3,4,5])p.values[i]=1;
 assert.equal(puzzleAnswer('cogitator',p).ok,true);assert.ok(poweredTiles(p.values).includes(5));p.values[4]=0;assert.equal(puzzleAnswer('cogitator',p).ok,false);
});
test('archive and phone require evidence and the right code without lockout',()=>{
 const p=freshPuzzles();p.laptop.text='0417';assert.equal(puzzleAnswer('laptop',p.laptop).ok,false);p.laptop.evidence=['archive-mail'];assert.equal(puzzleAnswer('laptop',p.laptop).ok,true);
 p.phone.text='0000';p.phone.evidence=['clinic-card'];assert.equal(puzzleAnswer('phone',p.phone).ok,false);p.phone.text='4821';assert.equal(puzzleAnswer('phone',p.phone).ok,true);
});
test('rescue timeline checks all four records in order',()=>{
 const p=freshPuzzles().timeline;assert.equal(puzzleAnswer('timeline',p).ok,false);p.values=[0,1,2,3];assert.equal(puzzleAnswer('timeline',p).ok,true);p.values=[0,1,3,2];assert.equal(puzzleAnswer('timeline',p).ok,false);
});
