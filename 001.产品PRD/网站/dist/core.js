export const CATEGORIES = [
  ['food','expense','餐饮','🍰'],['transport','expense','交通','🚎'],['shopping','expense','购物','🛍️'],['home','expense','居住','🏠'],['fun','expense','娱乐','🎮'],['health','expense','医疗','💊'],['study','expense','学习','📚'],['other-expense','expense','其他','✨'],['salary','income','工资','💼'],['bonus','income','奖金','🎁'],['other-income','income','其他','🌷']
].map(([id,type,name,icon],sortOrder)=>({id,type,name,icon,sortOrder}));
export const localDate = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function validDate(s) {
  if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const d=new Date(`${s}T12:00:00`);return !isNaN(d)&&localDate(d)===s&&s>='0001-01-01'&&s<=localDate();
}
export function amountFen(value) {
  const s=String(value).trim();if(!/^\d{1,8}(\.\d{1,2})?$/.test(s))throw Error('请输入大于零、最多两位小数的金额');
  const [whole,part='']=s.split('.');const n=Number(whole)*100+Number(part.padEnd(2,'0'));
  if(n<=0||n>9999999999)throw Error('金额须在 0.01 至 99,999,999.99 元之间');return n;
}
export const money=n=>(n/100).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
export function validateRecord(r,categories=CATEGORIES) {
  if(!r||typeof r.id!=='string'||!r.id||r.id.length>100)throw Error('记录标识无效');
  if(!['income','expense'].includes(r.type)||!categories.some(c=>c.id===r.categoryId&&c.type===r.type))throw Error('请选择对应的收支分类');
  if(!Number.isSafeInteger(r.amountFen)||r.amountFen<=0||r.amountFen>9999999999)throw Error('记录金额无效');
  if(!validDate(r.occurredDate))throw Error('请选择有效日期，且不能晚于今天');
  if(typeof r.note!=='string'||r.note.length>200)throw Error('备注最多 200 个字符');
  if(!['createdAt','updatedAt'].every(k=>typeof r[k]==='string'&&/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(r[k])&&!isNaN(Date.parse(r[k]))))throw Error('记录时间无效');
  return {id:r.id,type:r.type,amountFen:r.amountFen,categoryId:r.categoryId,occurredDate:r.occurredDate,note:r.note,createdAt:r.createdAt,updatedAt:r.updatedAt};
}
export function summarize(records,month) {
  let income=0,expense=0,todayExpense=0;const byCategory={},byDay={};const today=localDate();
  for(const r of records){if(r.type==='expense'&&r.occurredDate===today)todayExpense+=r.amountFen;if(!r.occurredDate.startsWith(month+'-'))continue;
    if(r.type==='income')income+=r.amountFen;else{expense+=r.amountFen;byCategory[r.categoryId]=(byCategory[r.categoryId]||0)+r.amountFen;byDay[r.occurredDate]=(byDay[r.occurredDate]||0)+r.amountFen;}}
  return {income,expense,balance:income-expense,todayExpense,byCategory,byDay};
}
export function filtered(records,{month,type='',category='',search=''}={}) {
  return records.filter(r=>(!month||r.occurredDate.startsWith(month+'-'))&&(!type||r.type===type)&&(!category||r.categoryId===category)&&r.note.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>b.occurredDate.localeCompare(a.occurredDate)||b.createdAt.localeCompare(a.createdAt));
}
export function backupData(records,budgets) {return {schemaVersion:1,exportedAt:new Date().toISOString(),records,categories:CATEGORIES,budgets};}
export function validateBackup(data) {
  if(!data||data.schemaVersion!==1||!Array.isArray(data.records)||!Array.isArray(data.budgets)||!Array.isArray(data.categories))throw Error('不是兼容的 V1 账本备份文件');
  if(data.records.length>100000)throw Error('单次最多导入 100,000 笔记录');
  if(data.categories.length!==CATEGORIES.length||CATEGORIES.some(c=>!data.categories.some(d=>d.id===c.id&&d.type===c.type&&d.name===c.name))||new Set(data.categories.map(c=>c.id)).size!==CATEGORIES.length)throw Error('分类配置不兼容');
  const records=data.records.map(r=>validateRecord(r));if(new Set(records.map(r=>r.id)).size!==records.length)throw Error('备份包含重复的记录标识');
  const budgets=data.budgets.map(b=>{if(!b||typeof b.month!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(b.month)||b.month<'0001-01'||!Number.isSafeInteger(b.amountFen)||b.amountFen<=0||b.amountFen>9999999999||typeof b.updatedAt!=='string'||!/(Z|[+-]\d{2}:\d{2})$/.test(b.updatedAt)||isNaN(Date.parse(b.updatedAt)))throw Error('预算数据无效');return {month:b.month,amountFen:b.amountFen,updatedAt:b.updatedAt};});
  if(new Set(budgets.map(b=>b.month)).size!==budgets.length)throw Error('备份包含重复月份预算');return {records,budgets};
}
export function csv(records) {
  const escape=v=>'"'+String(/^[\s]*[=+\-@\t\r]/.test(String(v))?"'"+v:v).replaceAll('"','""')+'"';
  return '\uFEFF'+[['日期','类型','分类','金额（元）','备注'],...records.map(r=>[r.occurredDate,r.type==='expense'?'支出':'收入',CATEGORIES.find(c=>c.id===r.categoryId)?.name||'其他',(r.amountFen/100).toFixed(2),r.note])].map(row=>row.map(escape).join(',')).join('\r\n');
}
