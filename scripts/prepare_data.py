"""Deterministic, audited source import. Raw addresses never enter public output."""
import csv, json, sys, shutil, unicodedata, collections, hashlib
from pathlib import Path
from decimal import Decimal
root = Path(sys.argv[1] if len(sys.argv)>1 else '..').resolve()
out = Path(__file__).resolve().parents[1] / 'public'
source = next(root.glob('Неделя 1*.csv'))
rows = list(csv.DictReader(source.open(encoding='utf-8-sig')))
normalize = lambda s: unicodedata.normalize('NFC', s).strip()
canonical = lambda s: normalize(s).replace('Груши','Лавки').replace('Груша','Лавка')
mapping = list(csv.DictReader((root/'items/positions.csv').open(encoding='utf-8-sig'), delimiter=';'))
lookup = {normalize(r['Название позиции']): r for r in mapping}
files = {normalize(p.name):p for p in (root/'items').iterdir()}
products = []; ids = {}; matches=collections.Counter(); missing=[]
(out/'items').mkdir(parents=True, exist_ok=True)
for name in sorted({r['item_name'] for r in rows}):
    row = next(r for r in rows if r['item_name']==name)
    match = lookup.get(normalize(name)) or lookup.get(canonical(name))
    image = None
    if match and normalize(match['Файл']) in files:
        src=files[normalize(match['Файл'])]; image=match['Код']+src.suffix.lower()
        shutil.copyfile(src,out/'items'/image)
        matches['exact' if normalize(name) in lookup else 'brandAlias']+=1
    else: missing.append(name)
    ids[name]=len(products)
    products.append({'id':len(products),'name':name,'category':row['category'],'image':image,'service':row['category']=='Услуги Груши'})
money=lambda v:int(Decimal(v)*100)
accepted=[]; skipped=collections.Counter(); seen=set(); inconsistencies=[]
for n,r in enumerate(rows,2):
    signature=tuple(r.values())
    if signature in seen: raise ValueError(f'Duplicate row {n}; review manually')
    seen.add(signature)
    for k in ['order_id','order_date','item_name','category','quantity','price','amount']:
        if not r[k]: raise ValueError(f'Missing {k}, row {n}')
    price=money(r['price']); paid=money(r['price_discounted']); amount=money(r['amount']); quantity=float(r['quantity'])
    if min(price,paid,amount,quantity)<0: raise ValueError(f'Return/negative row {n}; review manually')
    if Decimal(r['amount']) != Decimal(r['price_discounted'])*Decimal(r['quantity']): raise ValueError(f'Amount mismatch {n}')
    if price-paid != money(r['discount']): inconsistencies.append(n)
    if r['status']!='доставлен': skipped[r['status']]+=1; continue
    accepted.append({'order':r['order_id'],'date':r['order_date'],'product':ids[r['item_name']],'quantity':quantity,'spend':amount,'base':int(price*quantity)})
orders=collections.defaultdict(set)
for r in accepted: orders[r['order']].add(r['date'])
assert all(len(d)==1 for d in orders.values()),'Conflicting order dates'
spend=sum(r['spend'] for r in accepted); base=sum(r['base'] for r in accepted)
audit={'source':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceRows':len(rows),'acceptedRows':len(accepted),'excludedStatuses':dict(skipped),'duplicateRows':0,'negativeRows':0,'missingRequired':0,'missingDeliveredTime':sum(not r['delivered_time'] for r in rows),'amountMismatches':0,'discountMismatches':inconsistencies,'imageMatches':dict(matches),'unmatchedImages':missing,'minDate':min(r['date'] for r in accepted),'maxDate':max(r['date'] for r in accepted),'orders':len(orders),'spend':spend,'base':base,'savings':base-spend,'quantity':sum(r['quantity'] for r in accepted),'goodsQuantity':sum(r['quantity'] for r in accepted if not products[r['product']]['service']),'products':len({r['product'] for r in accepted}),'goodsProducts':len({r['product'] for r in accepted if not products[r['product']]['service']}),'categories':len({products[r['product']]['category'] for r in accepted})}
(out/'data').mkdir(exist_ok=True)
(out/'data/purchases.json').write_text(json.dumps({'products':products,'rows':accepted,'audit':audit},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(out/'data/audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(audit,ensure_ascii=False,indent=2))
