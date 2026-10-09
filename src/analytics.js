export const serviceCategory='Услуги Груши'
export function filterRows(rows,products,start,end,category=null){return rows.filter(r=>r.date>=start&&r.date<=end&&(!category||products[r.product].category===category))}
export function aggregate(rows,products){
 const orders=new Set(), items=new Set(),categories=new Set();let spend=0,base=0,quantity=0,goodsQuantity=0
 for(const r of rows){orders.add(r.order);items.add(r.product);categories.add(products[r.product].category);spend+=r.spend;base+=r.base;quantity+=r.quantity;if(!products[r.product].service)goodsQuantity+=r.quantity}
 return {orders:orders.size,spend,base,quantity,goodsQuantity,products:items.size,goodsProducts:[...items].filter(id=>!products[id].service).length,categories:categories.size,savings:base-spend,discount:base?100*(base-spend)/base:null,average:orders.size?spend/orders.size:null,unitPrice:quantity?spend/quantity:null}
}
export function grouped(rows,products,key){const groups=new Map();for(const r of rows){const k=key(r);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)}return [...groups].map(([key,lines])=>({key,...aggregate(lines,products),rows:lines}))}
export function monthKeys(start,end){const out=[];let [y,m]=start.slice(0,7).split('-').map(Number);while(`${y}-${String(m).padStart(2,'0')}`<=end.slice(0,7)){out.push(`${y}-${String(m).padStart(2,'0')}`);if(++m===13){m=1;y++}}return out}
export function monthly(rows,products,keys){const groups=new Map(grouped(rows,products,r=>r.date.slice(0,7)).map(x=>[x.key,x]));return keys.map(key=>({key,...aggregate([],products),...(groups.get(key)||{})}))}
export function previousPeriod(start,end){const a=new Date(start+'T00:00:00Z'),b=new Date(end+'T00:00:00Z'),days=Math.round((b-a)/86400000)+1;return {start:new Date(+a-days*86400000).toISOString().slice(0,10),end:new Date(+a-86400000).toISOString().slice(0,10),days}}
export function priceHistory(rows,products,id,keys){return monthly(rows.filter(r=>r.product===id),products,keys).map(r=>({key:r.key,value:r.quantity?r.spend/r.quantity:null,quantity:r.quantity}))}

// Inclusive trailing windows end at the last observed purchase, in UTC.
export function trailingPeriod(key,minDate,maxDate){
 if(key==='all')return {start:minDate,end:maxDate}
 const end=new Date(maxDate+'T00:00:00Z')
 let start
 if(key==='week'){start=new Date(+end-6*86400000)}
 else{const months={month:1,quarter:3,year:12,'1':1,'3':3,'12':12,'24':24}[key];if(!months)throw new Error('Unknown period');const y=end.getUTCFullYear(),m=end.getUTCMonth(),d=end.getUTCDate();const target=new Date(Date.UTC(y,m-months,1));const lastDay=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();target.setUTCDate(Math.min(d,lastDay));start=new Date(+target+86400000)}
 return {start:[minDate,start.toISOString().slice(0,10)].sort().at(-1),end:maxDate}
}
export function dateKeys(start,end){const result=[];for(let d=new Date(start+'T00:00:00Z');d.toISOString().slice(0,10)<=end;d=new Date(+d+86400000))result.push(d.toISOString().slice(0,10));return result}
export function periodSeries(rows,products,start,end){
 const daily=(new Date(end+'T00:00:00Z')-new Date(start+'T00:00:00Z'))/86400000<62
 const keys=daily?dateKeys(start,end):monthKeys(start,end)
 const groups=new Map(grouped(filterRows(rows,products,start,end),products,r=>daily?r.date:r.date.slice(0,7)).map(g=>[g.key,g]))
 return {daily,values:keys.map(key=>({key,...aggregate([],products),...(groups.get(key)||{})}))}
}
