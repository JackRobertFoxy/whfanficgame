import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
mkdirSync('release',{recursive:true});
execFileSync('python3',['-c',"import shutil; shutil.make_archive('release/quiet-world-web-v1.0','zip','dist')"],{stdio:'inherit'});
console.log('release/quiet-world-web-v1.0.zip — same site for desktop and Android browsers.');
