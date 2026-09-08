import {cp,mkdir,rm,readFile,access} from 'node:fs/promises';
const required=['app/ai/index.html','assets/ai/experience.css','assets/ai/experience.js','assets/ai/folio.js','assets/ai/recognition.js','assets/ai/recognition.css','assets/ai/score-cornet.png'];
for(const file of required) await access(file);
const html=await readFile('app/ai/index.html','utf8');
for(const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g))await access(match[1].slice(1));
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const entry of ['index.html','privacy','support','app','assets'])await cp(entry,`dist/${entry}`,{recursive:true});
console.log('Built static site. /app/ai/ and its local assets validated.');
