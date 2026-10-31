import {execFileSync} from 'node:child_process';
import {mkdirSync,copyFileSync} from 'node:fs';
mkdirSync('release',{recursive:true});mkdirSync('downloads',{recursive:true});
execFileSync('python3',['-c',"import shutil; shutil.make_archive('release/quiet-world-web-v1.1','zip','dist')"],{stdio:'inherit'});
copyFileSync('release/quiet-world-web-v1.1.zip','downloads/quiet-world-web-v1.1.zip');
console.log('release/quiet-world-web-v1.1.zip and downloads/quiet-world-web-v1.1.zip — static desktop and Android site.');
