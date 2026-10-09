import fs from 'node:fs'
const original=JSON.parse(fs.readFileSync('public/data/purchases.json','utf8'))
for(const p of original.products){const thumb='public/thumbnails/'+p.id+'.jpg';const path=fs.existsSync(thumb)?thumb:'public/items/'+p.image;p.imageData='data:image/'+(path.endsWith('.png')?'png':'jpeg')+';base64,'+fs.readFileSync(path).toString('base64')}
fs.writeFileSync('src/embedded-data.json',JSON.stringify(original))
console.log('Embedded audited data and all product images for sandbox publication')
