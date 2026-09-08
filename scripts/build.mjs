import {cp,mkdir,rm,readFile,access} from 'node:fs/promises';
const required=['index.html','app/ai/index.html','_redirects','assets/ai/experience.css','assets/ai/experience.js','assets/ai/folio.js','assets/ai/recognition.js','assets/ai/recognition.css','assets/ai/score-cornet.png'];
for(const file of required) await access(file);
const html=await readFile('index.html','utf8');
for(const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g))await access(match[1].slice(1));
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const entry of ['index.html','_redirects','privacy','support','app','assets'])await cp(entry,`dist/${entry}`,{recursive:true});
console.log('Built static site. Root product page, legacy redirect, and local assets validated.');
